import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../services/supabase";

export default function ProfileScreen() {

  // Aquí guardamos los datos del perfil que vienen de la BD
  const [profile, setProfile] = useState<any>(null);

  // URL de la imagen del avatar
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Estado para mostrar spinner mientras cargan cosas
  const [loading, setLoading] = useState(true);

  /**
   * Se ejecuta una vez cuando se monta la pantalla
   * Básicamente: carga los datos del perfil del usuario
   */
  useEffect(() => {
    fetchProfileData();
  }, []);

  /**
   * Función que:
   * 1. Obtiene el usuario actual de Supabase
   * 2. Busca su perfil en la tabla profiles
   * 3. Guarda los datos en el estado
   */
  const fetchProfileData = async () => {
    try {

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {

          setProfile(data);

          // Si hay imagen guardada, la cargamos
          // El timestamp (?t=...) sirve para evitar cache del móvil
          if (data.profile_image) {
            setImageUrl(`${data.profile_image}?t=${new Date().getTime()}`);
          }
        }
      }

    } catch (error: any) {

      console.error("Error cargando perfil:", error.message);

    } finally {

      setLoading(false);
    }
  };

  /**
   * Abre la galería del móvil para elegir una foto
   * Si el usuario selecciona algo → se sube
   */
  const handleEditAvatar = async () => {
    try {

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        await uploadProfileImage(result.assets[0]);
      }

    } catch (error) {

      Alert.alert("Error", "No se pudo abrir la galería");
    }
  };

  /**
   * Función que sube la imagen al storage y actualiza la BD
   * Flujo:
   * 1. Obtener usuario
   * 2. Crear nombre de archivo
   * 3. Subir a Supabase Storage
   * 4. Obtener URL pública
   * 5. Guardar URL en tabla profiles
   */
  const uploadProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {

    try {

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No hay sesión activa");

      // Sacamos extensión del archivo
      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";

      // Nombre único usando el ID del usuario
      const fileName = `${user.id}.${fileExt}`;

      /**
       * En React Native lo más estable es usar FormData
       * porque evita muchos problemas de subida binaria
       */
      const formData = new FormData();

      formData.append("file", {
        uri: asset.uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      /**
       * Subida al bucket de Supabase Storage
       * upsert:true significa que reemplaza la imagen anterior
       */
      const { error: uploadError } = await supabase.storage
        .from("avatard")
        .upload(fileName, formData, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      /**
       * Obtenemos la URL pública para poder mostrar la imagen
       */
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatard").getPublicUrl(fileName);

      /**
       * Guardamos la URL en la tabla profiles
       */
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ profile_image: publicUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      /**
       * Actualizamos el estado local para refrescar la UI
       * Otra vez añadimos timestamp para evitar cache
       */
      setImageUrl(`${publicUrl}?t=${new Date().getTime()}`);

      Alert.alert("¡Éxito!", "Imagen de perfil actualizada correctamente.");

    } catch (err: any) {

      console.error("DEBUG ERROR:", err);

      Alert.alert("Error", err.message || "No se pudo actualizar la imagen");

    } finally {

      setLoading(false);
    }
  };

  // Mientras carga mostramos spinner
  if (loading) {
    return (
      <ActivityIndicator size="large" color="#5CC2A3" style={{ flex: 1 }} />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* Avatar clickable */}
        <TouchableOpacity
          onPress={handleEditAvatar}
          style={styles.imageContainer}
        >

          {imageUrl ? (

            // Si hay imagen → la mostramos
            <Image source={{ uri: imageUrl }} style={styles.avatar} />

          ) : (

            // Si no hay imagen → mostramos inicial del usuario
            <View style={styles.placeholderAvatar}>
              <Text style={styles.placeholderText}>
                {profile?.username
                  ? profile.username.charAt(0).toUpperCase()
                  : "?"}
              </Text>
            </View>
          )}

          {/* Badge que indica que se puede editar */}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>EDITAR</Text>
          </View>

        </TouchableOpacity>

        {/* Nombre del usuario */}
        <Text style={styles.userName}>{profile?.username || "Usuario"}</Text>

        {/* Info adicional */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID ÚNICO:</Text>
          <Text style={styles.infoValue}>
            {profile?.id || "No disponible"}
          </Text>
        </View>

      </View>
    </View>
  );
}

// Solo estilos visuales
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F9F7",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 30,
    alignItems: "center",
    elevation: 8,
  },

  imageContainer: { position: "relative", marginBottom: 20 },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#FFF",
  },

  placeholderAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#5CC2A3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },

  placeholderText: { fontSize: 60, color: "#FFF", fontWeight: "900" },

  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2D5A4C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFF",
  },

  editBadgeText: { color: "white", fontSize: 10, fontWeight: "bold" },

  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 20,
  },

  infoRow: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 20,
  },

  infoLabel: {
    color: "#A0A0A0",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  infoValue: { color: "#2D5A4C", fontSize: 13, marginTop: 5 },
});
