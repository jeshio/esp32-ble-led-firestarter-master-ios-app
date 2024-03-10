import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Device} from 'react-native-ble-plx';
import {decode, encode} from 'base-64';
import {useDeviceFinder} from './useDeviceFinder';

const ackCharacteristicUUID = '00001abc-0000-1000-8000-00805f9b34fb';

function waitForAcknowledgmentFromESP32(
  connectedDevice: Device,
  serviceUUID: string,
) {
  return new Promise<boolean>((resolve, reject) => {
    // Timeout for acknowledgment in milliseconds
    const ackTimeout = 2000; // 10 seconds for example

    let timeout = setTimeout(() => {
      reject(new Error('Acknowledgment timeout'));
    }, ackTimeout);

    console.log('start subscription');
    // Setup notification subscription
    const subscription = connectedDevice.monitorCharacteristicForService(
      serviceUUID,
      ackCharacteristicUUID,
      (error, characteristic) => {
        // console.error(error);
        if (error) {
          clearTimeout(timeout);
          reject(error);
          return;
        }
        // console.log('ack characteristic', characteristic);

        if (characteristic && characteristic.value) {
          // Assuming the acknowledgment message is a simple string encoded in Base64.
          // Decode the Base64 message. You might need to adjust this based on your actual data format.
          const ackMessage = decode(characteristic.value);
          console.log('ackMessage', ackMessage);

          // Check if the acknowledgment message is the expected one
          if (ackMessage === 'LIGHTON' || ackMessage === 'LIGHTOFF') {
            clearTimeout(timeout);
            subscription.remove();
            resolve(ackMessage === 'LIGHTON');
          }
        }
      },
    );
  });
}

export const Test = () => {
  const {connectedDevice, findAndConnect, characteristicUUID, serviceUUID} =
    useDeviceFinder();
  const [responseTime, setResponseTime] = useState<number>();
  const [lightState, setLightState] = useState(false);

  const sendSignal = async () => {
    const cbWithDevice = async (device: Device) => {
      const ackReceived = waitForAcknowledgmentFromESP32(device, serviceUUID);
      const startTime = new Date().getTime();
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        encode('LIGHTON'),
      );
      let endTime = new Date().getTime();
      let rtt = endTime - startTime;
      console.log(`Send time: ${rtt} ms`);
      const newLightState = await ackReceived;
      setLightState(newLightState);

      endTime = new Date().getTime(); // Record the end time
      rtt = endTime - startTime; // Calculate the RTT
      console.log(`Round-trip time: ${rtt} ms`);
      setResponseTime(rtt);
    };

    if (!connectedDevice) {
      await findAndConnect(cbWithDevice);
    } else {
      await cbWithDevice(connectedDevice);
    }
  };

  return (
    <>
      {responseTime && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            left: 0,
            top: 150,
            display: 'flex',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: '#0f0',
              fontSize: 20,
              textAlign: 'center',
              width: 180,
            }}>
            Время на передачу: {responseTime} мс
          </Text>
        </View>
      )}
      <View>
        <Pressable onPress={sendSignal}>
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              backgroundColor: 'red',
              borderStyle: 'dotted',
              borderColor: 'yellow',
              borderWidth: lightState ? 15 : 0,
              padding: 30,
              maxWidth: 220,
              textAlign: 'center',
            }}>
            {lightState ? 'ВЫКЛЮЧИТЬ ЛАМПОЧКУ' : 'ВКЛЮЧИТЬ ЛАМПОЧКУ'}
          </Text>
        </Pressable>
      </View>
    </>
  );
};
