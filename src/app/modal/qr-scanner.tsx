import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
import { hapticFeedback } from '@/utils/haptics';

export default function QrScannerModal() {
  const router = useRouter();
  const setTable = useCartStore((state) => state.setTable);

  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleTableLookup = async (tokenOrNumber: string) => {
    if (!tokenOrNumber.trim()) return;
    setLoading(true);
    hapticFeedback.tap();

    try {
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
        hapticFeedback.success();
        setTable(tableRes.id, tableRes.tableNumber);
        Alert.alert('Table Selected! ☕', `Successfully checked into Table ${tableRes.tableNumber}!`);
        router.back();
      } else {
        hapticFeedback.error();
        Alert.alert('Table Not Found', 'Could not locate table with this QR code or number.');
      }
    } catch {
      hapticFeedback.error();
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
        <Ionicons name="camera-outline" size={64} color={Colors.uberGreen} />
        <Text style={[Typography.h3, { marginTop: Spacing.base, textAlign: 'center' }]}>
          Camera Permission Required
        </Text>
        <Text style={[Typography.bodyMedium, styles.permissionText]}>
          We need camera access to scan physical table QR codes at the café.
        </Text>
        <CafeButton
          title="Grant Permission"
          onPress={requestPermission}
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Top Header Controls */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Table QR Code</Text>
        <TouchableOpacity
          style={[styles.iconBtn, torchOn && { backgroundColor: Colors.uberGreen }]}
          onPress={() => {
            setTorchOn(!torchOn);
            hapticFeedback.tap();
          }}
        >
          <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Viewfinder Frame */}
      <View style={styles.viewfinderCenter}>
        <View style={styles.viewfinderBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.scannerInstruction}>
          Align the QR code on your table inside the frame to connect
        </Text>
      </View>

      {/* Manual Code Input Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Or enter table number manually</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Table 4"
            placeholderTextColor={Colors.textMuted}
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="numeric"
          />
          <CafeButton
            title="Connect"
            onPress={() => handleTableLookup(manualCode)}
            loading={loading}
            style={{ minWidth: 110 }}
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
    backgroundColor: '#FFFFFF',
  },
  permissionText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 54,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  viewfinderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderBox: {
    width: 240,
    height: 240,
    borderRadius: Radius.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: Colors.uberGreen,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  scannerInstruction: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.xl,
    maxWidth: 260,
    opacity: 0.9,
  },
  footer: {
    backgroundColor: 'rgba(20,18,16,0.92)',
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  footerTitle: {
    color: '#ECE0D6',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#282420',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#36302B',
    paddingHorizontal: Spacing.base,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
