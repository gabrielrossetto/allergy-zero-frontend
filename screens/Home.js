import React, { Component } from 'react';
import 'react-native-get-random-values';
import { uuid } from '../utils/helpers';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  Clipboard,
  Dimensions,
} from 'react-native';

import { Button, Text, theme, Block } from 'galio-framework';

import { Product } from '../components/';
import { materialTheme } from '../constants/';

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
}

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
  }

  _maybeRenderUploadingOverlay = () => {
    // refactor
    if (this.state.uploading) {
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
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      );
    }
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
  }

  _tryAgain = async () => {
    this.setState({
      image: null,
      uploading: false,
      googleResponse: null,
      product: null,
      productFoundError: false
    })
  }

  render() {
    let { image, product, googleResponse, productFoundError } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>

          {!image && (
            <>
              <View style={{ margin: 20 }}>
                <Button
                  style={[styles.button, styles.shadow]}
                  onPress={this._takePhoto}
                  color={materialTheme.COLORS.BUTTON_COLOR}
                >
                  Abrir câmera
                </Button>
              </View>

              <View style={{ margin: 20 }}>
                <Button
                  style={[styles.button, styles.shadow]}
                  color={materialTheme.COLORS.BUTTON_COLOR}
                  onPress={this._pickImage}>
                  Carregar foto da galeria
                </Button>
              </View>
            </>
          )}

          <View style={{ margin: 20 }}>
            {!googleResponse && !productFoundError && image && (
              <>
                <Button
                  style={[styles.button, styles.shadow]}
                  onPress={this._submitToGoogle}
                  color={materialTheme.COLORS.BUTTON_COLOR}
                >
                  Analyze!
                </Button>
              </>
            )}
            {image && !productFoundError && (
              <Block flex style={styles.group}>
                <Block flex>
                  <Block>
                    <Product product={image} full />
                  </Block>
                </Block>
              </Block>
            )}
            {productFoundError && (
              <>
                <Text bold size={16} style={styles.title}>Erro ao analisar a imagem</Text>

                <Button
                  style={[styles.button, styles.shadow]}
                  color={materialTheme.COLORS.BUTTON_COLOR}
                  onPress={this._tryAgain}>
                  Tente novamente
                </Button>
              </>
            )}
            {/* {this._maybeRenderUploadingOverlay()} */}
          </View>

        </ScrollView>
      </View>
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
  }
});