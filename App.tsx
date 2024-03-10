/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import {SafeAreaView, StyleProp, useColorScheme, ViewStyle} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {Test} from './src/components/Test';
import {bleManagerInstance} from './src/components/Test/useDeviceFinder';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle: StyleProp<ViewStyle> = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  };

  useEffect(() => () => bleManagerInstance.destroy(), []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <Test />
    </SafeAreaView>
  );
}

export default App;
