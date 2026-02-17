import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

import { supabase } from "../services/supabase";
import { RootStackParamList } from "../../App";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

const isValidEmail = (email: string) => /.+@.+/.test(email);

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Datos que escribe el usuario en el formulario
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Para mostrar el loading mientras pasan cosas (subida, registro, etc.)
  const [loading, setLoading] = useState(false);

  // Mensaje de error si algo falla
  const [error, setError] = useState("");

  // URI local de la imagen (para verla en pantalla antes de subirla)
  const [imageUri, setImageUri] = useState<string | null>(null);

  // URL final que devuelve Supabase cuando la imagen ya está subida
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Abre la galería del móvil, deja elegir imagen y luego la sube
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      await uploadProfileImage(asset);
    }
  };

  // Sube la imagen a Supabase Storage y guarda la URL pública
  const uploadProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setLoading(true);

      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("avatard")
        .upload(fileName, decode(asset.base64!), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatard")
        .getPublicUrl(fileName);

      setProfileImageUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Error subida:", err);
      Alert.alert("Error", "La imagen no se pudo subir al servidor.");
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  };

  // Se ejecuta cuando el usuario pulsa "Registrarse"
  // Valida datos, crea usuario en Auth y luego guarda info en la tabla profiles
  const handleRegister = async () => {
    setError("");

    if (!email || !username || !password || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) throw signUpError;

      if (signUpData?.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: signUpData.user.id,
          username: username,
          profile_image: profileImageUrl,
        });

        if (profileError) throw profileError;

        Alert.alert("¡Éxito!", "Cuenta creada. Confirma tu email.");
        navigation.navigate("Login");
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Crea tu cuenta</Text>

        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={pickImage}
          disabled={loading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>Añadir foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.hintText}>Toca para subir una foto</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#5CC2A3"
            style={{ marginVertical: 20 }}
          />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Registrarse ahora</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F2F9F7",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 30,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D5A4C",
    marginBottom: 20,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#A3D9C9",
    borderStyle: "dashed",
    marginBottom: 10,
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F3F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#5C9484", fontSize: 13, fontWeight: "600" },
  hintText: {
    fontSize: 12,
    color: "#8DA39E",
    marginBottom: 20,
    fontStyle: "italic",
  },
  input: {
    width: "100%",
    height: 56,
    backgroundColor: "#F7FBF9",
    borderWidth: 1.5,
    borderColor: "#E0EDE9",
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    color: "#2D5A4C",
  },
  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#5CC2A3",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  errorText: {
    color: "#E67E7E",
    fontSize: 14,
    marginBottom: 15,
    fontWeight: "600",
  },
});
