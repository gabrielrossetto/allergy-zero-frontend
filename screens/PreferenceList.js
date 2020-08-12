import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Platform, StyleSheet, Text, View, FlatList } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Image, Button, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MonoText } from '../components/StyledText';

export default function PreferenceList() {

  // const click = async () => {
  //   console.log('asddsasda');
  //   const response = await fetch('http://localhost:5000/api/mensagem');
  //   const body = await response.json();
  //   if (response.status !== 200) throw Error(body.message);
  //   return body;
  // };


  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        <View style={styles.getStartedContainer}>
          <Text style={styles.getStartedText}>
            testing first page
          </Text>
        </View>

        <Card containerStyle={styles.cardWrapper}>
          <Card containerStyle={styles.card}>
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.notes}>oprimeiro</Text>
              <Image style={{ width: 100, height: 100, marginBottom: 10 }} source={{ uri: "https://super.abril.com.br/wp-content/uploads/2016/10/super_imgde_onde_veio_a_expressao_bode_expiatorio.jpg?quality=70&strip=info&resize=680,453" }} />
              <Button
                buttonStyle={styles.arrowButton}
                icon={
                  <Icon
                    name="arrow-down"
                    size={30}
                    color="white"
                  />
                }
              />
            </View>
          </Card>
          <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(56, 172, 236, 1)' }}>
              <CheckBox title='Click Hereadsdasdasadsads' />
              <CheckBox title='Click Hereadsdasdasadsads' />
              <CheckBox title='Click Hereadsdasdasadsads' />
              <CheckBox title='Click Hereadsdasdasadsads' />
              <CheckBox title='Click Hereadsdasdasadsads' />
              <CheckBox title='Click Hereadsdasdasadsads' />
              <CheckBox title='Click Hereadsdasdasadsads' />
            </View>
          </View>
          {/* <Button onPress={click}>adsadsdsdassaddsa</Button> */}
        </Card>

      </ScrollView>

      <View style={styles.tabBarInfoContainer}>
        <Text style={styles.tabBarInfoText}>This is a tab bar. You can edit it in:</Text>

        <View style={[styles.codeHighlightContainer, styles.navigationFilename]}>
          <MonoText style={styles.codeHighlightText}>navigation/BottomTabNavigator.js</MonoText>
        </View>
      </View>
    </View>
  );
}

PreferenceList.navigationOptions = {
  header: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
  card: {
    backgroundColor: 'rgba(56, 172, 236, 1)',
    borderWidth: 0,
    borderRadius: 10
  },
  cardWrapper: {
    backgroundColor: 'white',
    borderWidth: 0,
    borderRadius: 10,
    boxShadow: '0, 0, 0, 0'
  },
  time: {
    fontSize: 38,
    color: '#fff'
  },
  notes: {
    fontSize: 18,
    color: '#fff',
    textTransform: 'capitalize',
    marginBottom: 10
  },
  arrowButton: {
    backgroundColor: 'rgba(56, 172, 236, 1)'
  }
});
