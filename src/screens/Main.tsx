import {
  StyleSheet,
  Text,
  View,
  Image,
  Keyboard,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {theme} from '../config';
import {IMainProps} from '../navigation/MainStack';
import {api} from '../api';
import {API_KEY} from '@env';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FlatGrid} from 'react-native-super-grid';
import RNFetchBlob from 'rn-fetch-blob';

interface IMain extends IMainProps {}

const Main: React.FC<IMain> = props => {
  const {navigation} = props;
  const {width, height} = useWindowDimensions();
  const {top, bottom} = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const [showClear, setShowClear] = useState(false);
  const [searchResults, setSearchResults] = useState<ApiTypes.SearchResponse>();
  const [loading, setLoading] = useState(true);

  const checkPermission = async () => {
    if (Platform.OS === 'ios') {
      console.log('IOS');

      downloadImage();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage access permistion',
            message: 'This app needs access to your storage to download Photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Once user grant the permission start downloading
          downloadImage();
        } else {
          // If permission denied then show alert
          Alert.alert('Error', 'Storage Permission Not Granted');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const downloadImage = async () => {
    RNFetchBlob.config({
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path: RNFetchBlob.fs.dirs.DownloadDir + '/image_name.jpg',
        description: 'Image',
      },
      IOSBackgroundTask: true,
      indicator: true,
      fileCache: true,
    })
      .fetch(
        'GET',
        'https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg',
      )
      .then(res => {
        Toast.show({type: 'success', text1: 'Downloaded'});
        console.log('The file saved to ', res.path());
      })
      .catch(error => {
        console.log(error);
      });
  };

  const handleSearch = () => {
    getMovies(searchText);
    setShowClear(true);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setSearchText('');
    setShowClear(false);
    getMovies('king');
  };

  const handleMapBtn = () => {
    navigation.navigate('Map');
  };

  useEffect(() => {
    getMovies(searchText.length == 0 ? 'king' : searchText);
  }, []);

  const getMovies = async (query: String) => {
    try {
      setLoading(true);
      const response = await api.get<ApiTypes.SearchResponse>('', {
        params: {
          s: query,
          apikey: API_KEY,
        },
      });

      setSearchResults(response.data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Movies search failed!',
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 800);
    }
  };

  return (
    <View
      style={[
        styles.mainContainer,
        {
          paddingTop: top + 5,
          paddingBottom: bottom,
        },
      ]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>{'CINEMA'}</Text>
        <TouchableOpacity onPress={handleMapBtn}>
          <Image
            source={require('../assets/icons/map.png')}
            style={styles.mapIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={'Find Your Movie'}
          placeholderTextColor={theme.black}
          autoCorrect={false}
          value={searchText}
          onChangeText={function (query) {
            setShowClear(false);
            return setSearchText(query);
          }}
        />

        <View style={styles.clearBtnContainer}>
          <TouchableOpacity onPress={showClear ? handleClear : handleSearch}>
            {showClear ? (
              <Image
                style={styles.inputAction}
                source={require('../assets/icons/clear.png')}
              />
            ) : (
              <Image
                style={styles.inputAction}
                source={require('../assets/icons/search.png')}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.animContainer}>
          <LottieView
            source={require('../assets/animations/loading.json')}
            autoPlay
            loop
            style={{aspectRatio: 1, width: 180}}
          />
        </View>
      ) : (
        <View style={{flex: 1}}>
          {searchResults != null && searchResults.Search.length != 0 ? (
            <FlatGrid
              itemDimension={120}
              data={searchResults.Search}
              style={styles.gridView}
              nestedScrollEnabled={true}
              renderItem={({item}) => (
                <View style={styles.gridItem}>
                  <TouchableOpacity onPress={checkPermission}>
                    <Image source={{uri: item.Poster}} style={styles.poster} />
                    <Text style={styles.title} numberOfLines={1}>
                      {item.Title}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <Text style={{color: theme.white}}>{'No Movies'}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  animContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.black,
    flex: 1,
  },
  mainContainer: {
    paddingHorizontal: 20,
    backgroundColor: theme.black,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoText: {
    color: theme.primery,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  mapIcon: {
    width: 28,
    height: 28,
    tintColor: theme.primery,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: theme.primery,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 45,
    marginTop: 20,
  },
  searchInput: {
    flex: 2,
    marginLeft: 6,
  },
  clearBtnContainer: {
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  inputAction: {
    width: 25,
    height: 25,
    marginRight: 8,
  },
  gridView: {
    marginTop: 10,
  },
  gridItem: {
    marginBottom: 5,
    borderRadius: 15,
  },
  poster: {
    aspectRatio: 1,
    borderRadius: 15,
  },
  title: {
    color: theme.primery,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 8,
  },
});

export default Main;
