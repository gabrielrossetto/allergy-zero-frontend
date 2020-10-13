import React, { Component } from 'react';
import 'react-native-get-random-values';
import { uuid } from '../utils/helpers';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Button,
  Share,
  FlatList,
  Clipboard,
  Image
} from 'react-native';

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

class Profile extends Component {
  state = {
    image: null,
    uploading: false,
    googleResponse: null,
  };

  async componentDidMount() {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    await Permissions.askAsync(Permissions.CAMERA);
  }

  test = async () => {
    const products = await firebase.firestore().collection('products').get();
    console.log(products.docs.map(doc => doc.data()));
  };

  organize = array => {
    return array.map(function (item, i) {
      return (
        <View key={i}>
          <Text>{item}</Text>
        </View>
      );
    });
  };

  _maybeRenderUploadingOverlay = () => {
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

  _maybeRenderImage = () => {
    let { image, googleResponse } = this.state;
    if (!image) {
      return;
    }

    return (
      <View
        style={{
          marginTop: 20,
          width: 250,
          borderRadius: 3,
          elevation: 2
        }}
      >
        <Button
          style={{ marginBottom: 10 }}
          onPress={() => this.submitToGoogle()}
          title="Analyze!"
        />

        <View
          style={{
            borderTopRightRadius: 3,
            borderTopLeftRadius: 3,
            shadowColor: 'rgba(0,0,0,1)',
            shadowOpacity: 0.2,
            shadowOffset: { width: 4, height: 4 },
            shadowRadius: 5,
            overflow: 'hidden'
          }}
        >
          <Image source={{ uri: image }} style={{ width: 250, height: 250 }} />
        </View>
        <Text
          onPress={this._copyToClipboard}
          onLongPress={this._share}
          style={{ paddingVertical: 10, paddingHorizontal: 10 }}
        />

        <Text>Raw JSON:</Text>

        {googleResponse && (
          <Text
            onPress={this._copyToClipboard}
            onLongPress={this._share}
            style={{ paddingVertical: 10, paddingHorizontal: 10 }}
          >
            {JSON.stringify(googleResponse.responses)}
          </Text>
        )}
      </View>
    );
  };

  _keyExtractor = (item, index) => item.description;

  _renderItem = item => {
    <Text>response: {JSON.stringify(item)}</Text>;
  };

  _share = () => {
    Share.share({
      message: JSON.stringify(this.state.googleResponse.responses),
      title: 'Check it out',
      url: this.state.image
    });
  };

  _copyToClipboard = () => {
    Clipboard.setString(this.state.image);
    alert('Copied to clipboard');
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

  submitToGoogle = async () => {
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
    return found.data();
  };

  _maybeRenderFirstItemFound = async () => {
    let { image } = this.state;
    let products = await firebase.firestore().collection('products').get();

    var a = await this._getProduct(products);
    console.log(a)

    if (!image) {
      return;
    }

    return (
      <View
        style={{
          marginTop: 20,
          width: 250,
          borderRadius: 3,
          elevation: 2
        }}
      >

      </View>
    );
  }


  render() {
    let { image } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.getStartedContainer}>
            {image ? null : (
              <Text style={styles.getStartedText}>Logo Detection App</Text>
            )}
          </View>

          <View style={styles.helpContainer}>
            <View style={{ margin: 20 }}>
              <Button
                onPress={this._pickImage}
                title="Pick an image from camera roll"
                color="#3b5998"
              />
            </View>
            <View style={{ margin: 20 }}>
              <Button
                onPress={this._takePhoto}
                title="Click a photo"
                color="#1985bc"
              />
            </View>

            <Button
              onPress={this.test}
              title="Test"
              color="#1985bc"
            />

            {/* <Image source={{ uri: "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" }} style={{ width: 250, height: 250 }} /> */}

            {this._maybeRenderImage()}
            {this._maybeRenderUploadingOverlay()}
          </View>
        </ScrollView>
      </View>
    );
  }
}

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebebeb',
    paddingBottom: 10
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center'
  },
  contentContainer: {
    paddingTop: 30
  },

  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
    marginVertical: 50
  },

  getStartedText: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  helpContainer: {
    marginTop: 15,
    alignItems: 'center'
  },

  logoText: {
    fontSize: 20,
    fontWeight: '600'
  }
});