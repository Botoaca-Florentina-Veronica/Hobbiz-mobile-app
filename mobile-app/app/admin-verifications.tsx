import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { ThemedTextInput } from '../components/themed-text-input';
import { Toast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { 
  getPendingVerifications, 
  verifyDocument, 
  toggleUserVerification,
  getUserDocumentsAdmin,
  type UserWithDocuments,
  type VerificationDocument 
} from '../src/services/verificationService';

export default function AdminVerificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens, isDark } = useAppTheme();
  
  const [users, setUsers] = useState<UserWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDocuments | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Confirmation Dialog states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmIcon, setConfirmIcon] = useState('alert-circle-outline');
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);

  // Rejection Modal states
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [targetDoc, setTargetDoc] = useState<{ userId: string; docId: string } | null>(null);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await getPendingVerifications();
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error fetching pending verifications:', error);
      if (error?.response?.status === 403) {
        showToast('Nu ai permisiuni de administrator.', 'error');
        router.back();
      } else {
        showToast('Nu s-au putut încărca verificările în așteptare.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (userId: string, documentId: string, status: 'verified' | 'rejected') => {
    if (status === 'rejected') {
      setTargetDoc({ userId, docId: documentId });
      setRejectionReason('');
      setRejectionModalVisible(true);
    } else {
      setConfirmTitle('Verificare Document');
      setConfirmMessage('Sigur vrei să verifici acest document ca fiind autentic?');
      setConfirmIcon('checkmark-shield-outline');
      setConfirmColor(tokens.colors.primary);
      setConfirmAction(() => () => performVerification(userId, documentId, status));
      setConfirmVisible(true);
    }
  };

  const confirmRejection = async () => {
    if (!targetDoc || !rejectionReason.trim()) {
      showToast('Te rugăm să introduci un motiv pentru respingere.', 'info');
      return;
    }
    await performVerification(targetDoc.userId, targetDoc.docId, 'rejected', rejectionReason);
    setRejectionModalVisible(false);
  };

  const performVerification = async (
    userId: string, 
    documentId: string, 
    status: 'verified' | 'rejected',
    rejectionReasonText?: string
  ) => {
    try {
      setProcessing(true);
      await verifyDocument(userId, documentId, status, rejectionReasonText);
      showToast(
        `Document ${status === 'verified' ? 'verificat' : 'respins'} cu succes.`,
        status === 'verified' ? 'success' : 'info'
      );
      fetchPendingVerifications();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error verifying document:', error);
      showToast('Nu s-a putut procesa documentul.', 'error');
    } finally {
      setProcessing(false);
      setConfirmVisible(false);
    }
  };

  const handleToggleVerificationBadge = async (userId: string, currentStatus: boolean) => {
    setConfirmTitle(currentStatus ? 'Eliminare Badge' : 'Acordare Badge');
    setConfirmMessage(`Sigur vrei să ${currentStatus ? 'elimini' : 'acorzi'} badge-ul de verificare acestui utilizator?`);
    setConfirmIcon(currentStatus ? 'close-circle-outline' : 'checkmark-circle-outline');
    setConfirmColor(currentStatus ? '#F44336' : tokens.colors.primary);
    setConfirmAction(() => async () => {
      try {
        setProcessing(true);
        await toggleUserVerification(userId, !currentStatus);
        showToast(
          `Badge ${!currentStatus ? 'acordat' : 'eliminat'} cu succes.`,
          !currentStatus ? 'success' : 'info'
        );
        fetchPendingVerifications();
      } catch (error) {
        console.error('Error toggling verification badge:', error);
        showToast('Nu s-a putut actualiza badge-ul.', 'error');
      } finally {
        setProcessing(false);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const handleViewUserDocuments = async (user: UserWithDocuments) => {
    try {
      setProcessing(true);
      const response = await getUserDocumentsAdmin(user._id);
      setSelectedUser(response.user);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      showToast('Nu s-au putut încărca documentele utilizatorului.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
      default:
        return '#FF9800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verificat';
      case 'rejected':
        return 'Respins';
      case 'pending':
      default:
        return 'În așteptare';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: insets.top + 10,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    content: {
      flex: 1,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: tokens.colors.primary + '30',
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    userEmail: {
      fontSize: 14,
      color: tokens.colors.muted,
      marginTop: 2,
    },
    pendingCount: {
      fontSize: 12,
      color: '#FF9800',
      marginTop: 4,
      fontWeight: '600',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF5020',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    verifiedText: {
      fontSize: 12,
      color: '#4CAF50',
      fontWeight: '600',
      marginLeft: 4,
    },
    documentCard: {
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    documentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
      marginBottom: 4,
    },
    documentType: {
      fontSize: 14,
      color: tokens.colors.muted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 16,
    },
    modalInput: {
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    rejectConfirmButton: {
      borderRadius: 12,
      alignItems: 'center',
    },
    rejectConfirmButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    documentActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: tokens.colors.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    approveButton: {
      backgroundColor: '#4CAF5020',
    },
    rejectButton: {
      backgroundColor: '#F4433620',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    approveButtonText: {
      color: '#4CAF50',
    },
    rejectButtonText: {
      color: '#F44336',
    },
    badgeControl: {
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    badgeControlHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
      marginBottom: 12,
    },
    badgeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
    },
    grantBadgeButton: {
      backgroundColor: '#4CAF50',
    },
    revokeBadgeButton: {
      backgroundColor: '#F44336',
    },
    badgeButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: tokens.colors.muted,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backToListButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    backToListText: {
      fontSize: 14,
      color: tokens.colors.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificări în așteptare</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (selectedUser) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedUser(null)}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documente Utilizator</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.userCard}>
            {selectedUser.avatar ? (
              <Image source={{ uri: selectedUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={30} color={tokens.colors.primary} style={{ alignSelf: 'center', marginTop: 10 }} />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <Text style={styles.userEmail}>{selectedUser.email}</Text>
            </View>
            {selectedUser.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verificat</Text>
              </View>
            )}
          </View>

          <View style={styles.badgeControl}>
            <Text style={styles.badgeControlHeader}>Badge de Verificare</Text>
            <TouchableOpacity
              style={[
                styles.badgeButton,
                selectedUser.isVerified ? styles.revokeBadgeButton : styles.grantBadgeButton
              ]}
              onPress={() => handleToggleVerificationBadge(selectedUser._id, selectedUser.isVerified)}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={selectedUser.isVerified ? "close-circle" : "checkmark-circle"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.badgeButtonText}>
                    {selectedUser.isVerified ? 'Elimină Badge' : 'Acordă Badge'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {(selectedUser.documents || []).map((doc) => (
            <View key={doc._id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentType}>{doc.type}</Text>
                  <Text style={[styles.documentType, { marginTop: 4 }]}>
                    Încărcat: {new Date(doc.uploadedAt).toLocaleDateString('ro-RO')}
                  </Text>
                  
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginTop: 10,
                      backgroundColor: tokens.colors.primary + '15',
                      padding: 8,
                      borderRadius: 6,
                      alignSelf: 'flex-start'
                    }}
                    onPress={() => Linking.openURL(doc.url)}
                  >
                    <Ionicons name="eye-outline" size={18} color={tokens.colors.primary} />
                    <Text style={{ color: tokens.colors.primary, marginLeft: 6, fontWeight: '600', fontSize: 13 }}>
                      Vezi Fișier Document
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#fff' }]} />
                  <Text style={styles.statusText}>{getStatusLabel(doc.status)}</Text>
                </View>
              </View>

              {doc.status === 'pending' && (
                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'verified')}
                    disabled={processing}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.actionButtonText, styles.approveButtonText]}>
                      Aprobă
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'rejected')}
                    disabled={processing}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                      Respinge
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {doc.rejectionReason && (
                <ThemedText style={{ marginTop: 8, fontSize: 14, color: '#F44336' }}>
                  Motiv respingere: {doc.rejectionReason}
                </ThemedText>
              )}
            </View>
          ))}
        </ScrollView>

        <ConfirmDialog
          visible={confirmVisible}
          title={confirmTitle}
          message={confirmMessage}
          icon={confirmIcon}
          confirmColor={confirmColor}
          onConfirm={() => confirmAction?.()}
          onCancel={() => setConfirmVisible(false)}
        />

        <Modal
          visible={rejectionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Motiv Respingere</ThemedText>
                <TouchableOpacity onPress={() => setRejectionModalVisible(false)}>
                  <Ionicons name="close" size={24} color={tokens.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20, paddingBottom: 40 }}>
                <ThemedText style={styles.inputLabel}>De ce respingi acest document?</ThemedText>
                <ThemedTextInput
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="Ex: Document neclar, expirat..."
                  placeholderTextColor={tokens.colors.muted}
                  multiline
                  numberOfLines={4}
                  style={[styles.modalInput, styles.textArea, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
                />

                <TouchableOpacity
                  style={[styles.rejectConfirmButton, { 
                    backgroundColor: '#F44336', 
                    marginTop: 20, 
                    justifyContent: 'center',
                    paddingVertical: 14 
                  }]}
                  onPress={confirmRejection}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.rejectConfirmButtonText, { color: '#fff' }]}>Confirmă Respingerea</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </Modal>

        <Toast 
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={5000}
          onHide={() => setToastVisible(false)}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificări în așteptare</Text>
      </View>

      <ScrollView style={styles.content}>
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={tokens.colors.muted} />
            <ThemedText style={styles.emptyStateText}>
              Nu există verificări în așteptare.
            </ThemedText>
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={styles.userCard}
              onPress={() => handleViewUserDocuments(user)}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color={tokens.colors.primary} style={{ alignSelf: 'center', marginTop: 10 }} />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.pendingCount}>
                  {user.pendingDocuments?.length || 0} documente în așteptare
                </Text>
              </View>
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verificat</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={24} color={tokens.colors.muted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <ConfirmDialog
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        icon={confirmIcon}
        confirmColor={confirmColor}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmVisible(false)}
      />

      <Modal
        visible={rejectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Motiv Respingere</ThemedText>
              <TouchableOpacity onPress={() => setRejectionModalVisible(false)}>
                <Ionicons name="close" size={24} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, paddingBottom: 40 }}>
              <ThemedText style={styles.inputLabel}>De ce respingi acest document?</ThemedText>
              <ThemedTextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Ex: Document neclar, expirat..."
                placeholderTextColor={tokens.colors.muted}
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.textArea, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
              />

              <TouchableOpacity
                style={[styles.rejectConfirmButton, { 
                  backgroundColor: '#F44336', 
                  marginTop: 20, 
                  justifyContent: 'center',
                  paddingVertical: 14 
                }]}
                onPress={confirmRejection}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.rejectConfirmButtonText, { color: '#fff' }]}>Confirmă Respingerea</Text>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Toast 
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={5000}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}