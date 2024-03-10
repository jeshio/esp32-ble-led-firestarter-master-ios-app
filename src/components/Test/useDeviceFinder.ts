import {useEffect, useState} from 'react';
import {BleManager, Device} from 'react-native-ble-plx';
import {Platform} from 'react-native';

// Replace 'ESP32_DEVICE_ID' with your ESP32's actual device ID
const deviceId = 'C38FD005-6F0A-5F94-F354-F21CB31B3E24';
// Replace with your characteristic UUID
const characteristicUUID = '0000dead-0000-1000-8000-00805f9b34fb';
// Replace with your service UUID
const serviceUUID = '00000180-0000-1000-8000-00805f9b34fb';

export const bleManagerInstance = new BleManager();

export const useDeviceFinder = () => {
  const [connectedDevice, setConnectedDevice] = useState<Device>();

  useEffect(() => {
    // Request permission to use Bluetooth on iOS
    const initBLE = async () => {
      if (Platform.OS === 'ios') {
        const state = await bleManagerInstance.state();
        if (state === 'PoweredOff') {
          // alert('Please turn on Bluetooth');
        }
      }
    };

    void initBLE();
    return () => {
      connectedDevice?.cancelConnection();
      bleManagerInstance.destroy();
    };
  }, []);

  const findAndConnect = async (cbWithDevice: (device: Device) => void) => {
    try {
      // Scanning for devices
      console.log('Scanning for devices...');
      await bleManagerInstance.startDeviceScan(
        null,
        null,
        (error, scannedDevice) => {
          if (scannedDevice) {
            console.log(scannedDevice.id, scannedDevice.name);
          }
          if (error) {
            console.log(error);
            return;
          }
          if (scannedDevice && scannedDevice.id === deviceId) {
            console.log(`Device found: ${scannedDevice.name}`);
            bleManagerInstance.stopDeviceScan();

            // Connecting to the device
            scannedDevice
              .connect()
              .then(device => {
                console.log(`Connected to ${device.name}`);
                return device.discoverAllServicesAndCharacteristics();
              })
              .then(device => {
                setConnectedDevice(device);
                cbWithDevice(device);
                return device;
              })
              .catch(error => {
                console.log(error);
              });
          }
        },
      );
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }
  };

  return {
    connectedDevice,
    findAndConnect,
    characteristicUUID,
    serviceUUID,
  };
};
