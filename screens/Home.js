import React, { Component } from 'react';
import 'react-native-get-random-values';
import { uuid } from '../utils/helpers';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import { Button, Text, theme, Block } from 'galio-framework';

import { Product } from '../components/';
import { materialTheme, products } from '../constants/';

const { width } = Dimensions.get('screen');

import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';

import Environment from '../config/environment';
import firebase from '../config/firebase'
import 'firebase/firestore';

async function uploadImageAsync(uri) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

  const ref = firebase
    .storage()
    .ref()
    .child(uuid());
  const snapshot = await ref.put(blob);
  blob.close();

  return await snapshot.ref.getDownloadURL();
};

class Home extends Component {
  state = {
    image: null,
    uploading: false,
    googleResponse: null,
    product: null,
    productFoundError: false
  };

  async componentDidMount() {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    await Permissions.askAsync(Permissions.CAMERA);
  };

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3]
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3]
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async pickerResult => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        let uploadUrl = await uploadImageAsync(pickerResult.uri);
        this.setState({ image: uploadUrl });
      }
    } catch (e) {
      alert('Upload failed, sorry :(');
    } finally {
      this.setState({ uploading: false });
    }
  };

  _submitToGoogle = async () => {
    try {
      this.setState({ uploading: true });
      let { image } = this.state;
      let body = JSON.stringify({
        requests: [
          {
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'LANDMARK_DETECTION', maxResults: 5 },
              { type: 'FACE_DETECTION', maxResults: 5 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'TEXT_DETECTION', maxResults: 5 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 5 },
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 5 },
              { type: 'IMAGE_PROPERTIES', maxResults: 5 },
              { type: 'CROP_HINTS', maxResults: 5 },
              { type: 'WEB_DETECTION', maxResults: 5 }
            ],
            image: {
              source: {
                imageUri: image
              }
            }
          }
        ]
      });
      let response = await fetch(
        'https://vision.googleapis.com/v1/images:annotate?key=' +
        Environment['GOOGLE_CLOUD_VISION_API_KEY'],
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: body
        }
      );
      let responseJson = await response.json();
      this.setState({
        googleResponse: responseJson,
        uploading: false
      });
      this._maybeRenderFirstItemFound();
    } catch (error) {
      console.log(error);
    }
  };

  _getProduct = async (products) => {
    let { googleResponse } = this.state;
    let found = products.docs.find(currentDb => googleResponse.responses[0].logoAnnotations[0].description.toUpperCase() === currentDb.data().description.toUpperCase())

    if (found) {
      return found.data();
    }
    return;
  };

  _maybeRenderFirstItemFound = async () => {
    let products = await firebase.firestore().collection('products').get();
    var productFound = await this._getProduct(products);

    if (productFound) {
      this.setState({ product: productFound });
    } else {
      this.setState({ productFoundError: true });
    }
  };

  _tryAgain = async () => {
    this.setState({
      image: null,
      uploading: false,
      googleResponse: null,
      product: null,
      productFoundError: false
    })
  };

  _maybeRenderCameraAndGalery = () => {
    let { image } = this.state;

    if (!image) {
      return (
        <>
          <View style={{ margin: 15 }}>
            <Button
              style={[styles.button, styles.shadow]}
              onPress={this._takePhoto}
              color={materialTheme.COLORS.BUTTON_COLOR}
            >
              Abrir câmera
            </Button>
          </View>

          <View style={{ margin: 15 }}>
            <Button
              style={[styles.button, styles.shadow]}
              color={materialTheme.COLORS.BUTTON_COLOR}
              onPress={this._pickImage}>
              Carregar foto da galeria
            </Button>
          </View>
        </>
      );
    }
  };

  _maybeRenderAnalyze = () => {
    let { uploading, googleResponse, productFoundError, image } = this.state;

    if (!uploading && !googleResponse && !productFoundError && image) {
      return (
        <>
          <Button
            style={[styles.button, styles.shadow]}
            onPress={this._submitToGoogle}
            color={materialTheme.COLORS.BUTTON_COLOR}
          >
            Analisar
          </Button>
        </>
      );
    }
  };

  _maybeRenderProductText = () => {
    let { product } = this.state;

    if (product) {
      return (
        <>
          <Text bold size={16} style={styles.title}>Produto escolhido: {product.description}</Text>
        </>
      );
    }
  };

  _maybeRenderProductImage = () => {
    let { uploading, image, productFoundError } = this.state;

    if (!uploading && image && !productFoundError) {
      return (
        <Block flex style={styles.group}>
          <Block flex>
            <Block>
              <Product product={image} full />
            </Block>
          </Block>
        </Block>
      );
    }
  };

  _maybeRenderProductRecomendation = () => {
    let { product } = this.state;

    if (product) {
      if (product.isAllowedToVegans && !product.isAllowedToVegetarians) {
        return (
          <>
            <Text bold size={16} style={styles.title}>Este produto é recomendado para pessoas: </Text>
            <Block flex style={styles.group}>
              <Block flex>
                <Block flex row>
                  <Product product={products[0].image} style={{ margin: 5 }} />
                </Block>
              </Block>
            </Block>
          </>
        );
      } else if (!product.isAllowedToVegans && product.isAllowedToVegetarians) {
        return (
          <>
            <Text bold size={16} style={styles.title}>Este produto é recomendado para pessoas: </Text>
            <Block flex style={styles.group}>
              <Block flex>
                <Block flex row>
                  <Product product={products[1].image} style={{ margin: 5 }} />
                </Block>
              </Block>
            </Block>
          </>
        );

      } else if (product.isAllowedToVegans && product.isAllowedToVegetarians) {
        return (
          <>
            <Text bold size={16} style={styles.title}>Este produto é recomendado para pessoas: </Text>
            <Block flex style={styles.group}>
              <Block flex>
                <Block flex row>
                  <Product product={products[0].image} style={{ margin: 5 }} />
                  <Product product={products[1].image} style={{ margin: 5 }} />
                </Block>
              </Block>
            </Block>
          </>
        );
      }
    }
  };

  _maybeRenderProductContained = () => {
    let { product } = this.state;

    if (product) {
      return (
        <View style={{ margin: 15 }}>
          <Text bold size={16} style={styles.title}>Este produto contém: </Text>
          <Block flex style={styles.group}>
            <Block flex>
              <Block flex row>
                {product.isBeefContaining && (<Product product={products[2].image} style={{ margin: 5 }} />)}
                {product.isPigMeatContaining && (<Product product={products[3].image} style={{ margin: 5 }} />)}
              </Block>
              <Block flex row>
                {product.isFishfContaining && (<Product product={products[4].image} style={{ margin: 5 }} />)}
                {product.isChickenContaining && (<Product product={products[5].image} style={{ margin: 5 }} />)}
              </Block>
              <Block flex row>
                {product.isEggContaining && (<Product product={products[6].image} style={{ margin: 5 }} />)}
                {product.isCaffeineContaining && (<Product product={products[7].image} style={{ margin: 5 }} />)}
              </Block>
              <Block flex row>
                {product.isGlutenContaining && (<Product product={products[8].image} style={{ margin: 5 }} />)}
                {product.isLactoseContaining && (<Product product={products[9].image} style={{ margin: 5 }} />)}
              </Block>
              <Block flex row>
                {product.isPeanutContaining && (<Product product={products[10].image} style={{ margin: 5 }} />)}
                {product.isSoyContaining && (<Product product={products[11].image} style={{ margin: 5 }} />)}
              </Block>
            </Block>
          </Block>
        </View >
      );
    }
  };

  _maybeRenderProductError = () => {
    let { productFoundError } = this.state;

    if (productFoundError) {
      return (
        <>
          <Text bold size={16} style={styles.title}>Erro ao analisar a imagem</Text>
          <Button
            style={[styles.button, styles.shadow]}
            color={materialTheme.COLORS.BUTTON_COLOR}
            onPress={this._tryAgain}>
            Tente novamente
          </Button>
        </>
      );
    }
  };


  _maybeRenderUploadingOverlay = () => {
    let { uploading } = this.state;

    if (uploading) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(255,255,255,0.4)',
              alignItems: 'center',
              justifyContent: 'center'
            }
          ]}
        >
          <ActivityIndicator color={materialTheme.COLORS.PRIMARY} animating size="large" />
        </View>
      );
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>

          {this._maybeRenderCameraAndGalery()}

          <View style={{ margin: 15 }}>

            {this._maybeRenderAnalyze()}

            {this._maybeRenderProductText()}

            {this._maybeRenderProductImage()}

            {this._maybeRenderProductRecomendation()}

            {this._maybeRenderProductContained()}

            {this._maybeRenderProductError()}

            {this._maybeRenderUploadingOverlay()}
          </View>
        </ScrollView>
      </View >
    );
  }
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebebeb',
    paddingBottom: 10
  },
  contentContainer: {
    paddingTop: 30
  },
  group: {
    paddingTop: theme.SIZES.BASE * 3.75,
  },
  shadow: {
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.2,
    elevation: 2,
  },
  button: {
    marginBottom: theme.SIZES.BASE,
    width: width - (theme.SIZES.BASE * 2),
  },
  title: {
    paddingVertical: theme.SIZES.BASE,
    paddingHorizontal: theme.SIZES.BASE * 2,
  }
});