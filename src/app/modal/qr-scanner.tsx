import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/api/client';
import { useCartStore } from '@/stores/cartStore';
import { CafeButton } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/dimens';
import { Typography } from '@/constants/typography';
import { ApiResponse } from '@/types/auth';

export default function QrScannerModal() {
  const router = useRouter();
  const setTable = useCartStore((state) => state.setTable);

  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleTableLookup = async (tokenOrNumber: string) => {
    if (!tokenOrNumber.trim()) return;
    setLoading(true);

    try {
      // Try lookup by table number or qr token
      const num = parseInt(tokenOrNumber, 10);
      let tableRes;

      if (!isNaN(num)) {
        const res = await apiClient.get<ApiResponse<any[]>>(`/tables?tableNumber=${num}`);
        const tables = res.data.data || [];
        tableRes = tables[0];
      } else {
        const res = await apiClient.get<ApiResponse<any>>(`/tables/qr/${tokenOrNumber.trim()}`);
        tableRes = res.data.data;
      }

      if (tableRes) {
        setTable(tableRes.id, tableRes.tableNumber);
        Alert.alert('Table Selected', `Successfully checked into Table ${tableRes.tableNumber}!`);
        router.back();
      } else {
        Alert.alert('Table Not Found', 'Could not locate table with this QR code or number.');
      }
    } catch (e) {
      Alert.alert('Error', 'Invalid table reference or network error');
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    handleTableLookup(data);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.cafeBrown} />
        <Text style={[Typography.h3, { marginTop: Spacing.base, textAlign: 'center' }]}>
          Camera Permission Required
        </Text>
        <Text style={[Typography.bodyMedium, styles.permissionText]}>
          We need camera access to scan physical table QR codes at the café.
        </Text>
        <CafeButton title="Grant Permission" onPress={requestPermission} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scannerBox}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
          <Text style={styles.instructionText}>Align table QR code within the frame</Text>
        </View>
      </CameraView>

      {/* Manual Input Fallback Footer */}
      <View style={styles.footer}>
        <Text style={[Typography.labelMedium, { marginBottom: Spacing.xs, color: Colors.textPrimary }]}>
          Or enter table number manually:
        </Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. 1, 2, 3..."
            placeholderTextColor={Colors.textMuted}
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="number-pad"
          />
          <CafeButton
            title="Check In"
            size="sm"
            loading={loading}
            onPress={() => handleTableLookup(manualCode)}
            style={{ marginLeft: Spacing.sm }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  permissionText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 280,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerBox: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderColor: Colors.cafeGold,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderColor: Colors.cafeGold,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 32,
    height: 32,
    borderColor: Colors.cafeGold,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderColor: Colors.cafeGold,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
    marginTop: Spacing.xl,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    height: 44,
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
