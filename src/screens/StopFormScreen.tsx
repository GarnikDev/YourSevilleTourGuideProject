import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../services/supabase";
import { RootStackParamList } from "../../App";

type Props = {
  route: RouteProp<RootStackParamList, "StopForm">;
  navigation: NativeStackNavigationProp<RootStackParamList, "StopForm">;
};

export default function StopFormScreen({ route, navigation }: Props) {

  // Datos que vienen desde la pantalla anterior (id del tour y si estamos editando)
  const { tourId, stopId } = route.params;

  // Si existe stopId significa que estamos editando, si no, creando
  const isEdit = !!stopId;

  // Nombre del monumento/parada
  const [title, setTitle] = useState("");

  // Texto que luego se convertirá en audio
  const [description, setDescription] = useState("");

  // Número de orden dentro del tour
  const [order, setOrder] = useState("");

  // Coordenadas del mapa (latitud y longitud)
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Para mostrar el loading cuando se está guardando
  const [saving, setSaving] = useState(false);

  // Cuando la pantalla se abre, si estamos editando, cargamos los datos de la parada
  useEffect(() => {
    if (isEdit) fetchStop();
  }, [stopId]);

  // Trae la parada desde Supabase y rellena el formulario
  async function fetchStop() {
    const { data, error } = await supabase
      .from("stops")
      .select("*")
      .eq("id", stopId)
      .single();

    if (error || !data) {
      Alert.alert("Error", "No se pudo cargar la parada.");
      return;
    }

    setTitle(data.title);
    setDescription(data.description || "");
    setOrder(data.stop_order.toString());
    setCoord({ lat: data.latitude, lng: data.longitude });
  }

  // Guarda la parada en la base de datos (crear o actualizar)
  const saveStop = async () => {

    // Validaciones rápidas para que no falten datos
    if (!title.trim()) return Alert.alert("Error", "El título es obligatorio.");
    if (!coord) return Alert.alert("Error", "Toca el mapa para seleccionar la ubicación.");
    if (!order.trim()) return Alert.alert("Error", "El orden de la parada es obligatorio.");

    setSaving(true);

    // Objeto que vamos a enviar a Supabase
    const stopData = {
      tour_id: tourId,
      title: title.trim(),
      description: description.trim(),
      latitude: coord.lat,
      longitude: coord.lng,
      stop_order: parseInt(order),
    };

    let error;

    // Si estamos editando → update
    // Si estamos creando → insert
    if (isEdit) {
      ({ error } = await supabase.from("stops").update(stopData).eq("id", stopId));
    } else {
      ({ error } = await supabase.from("stops").insert(stopData));
    }

    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("¡Éxito!", isEdit ? "Parada actualizada correctamente" : "Parada creada correctamente");
      navigation.goBack(); // Volvemos atrás y la pantalla anterior se refresca sola
    }
  };

  // Región inicial del mapa
  // Si ya hay coordenadas usamos esas
  // Si no, usamos Sevilla por defecto
  const initialRegion = coord
    ? {
        latitude: coord.lat,
        longitude: coord.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : {
        latitude: 37.3891,   // Sevilla por defecto
        longitude: -5.9845,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Text style={styles.mainTitle}>
          {isEdit ? "Editar Parada" : "Nueva Parada"}
        </Text>

        <Text style={styles.label}>Nombre del Monumento</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Torre del Oro"
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Historia para la Audioguía</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Escribe aquí lo que la voz leerá..."
        />

        <Text style={styles.label}>Orden de la parada</Text>
        <TextInput
          style={styles.input}
          value={order}
          onChangeText={setOrder}
          keyboardType="numeric"
          placeholder="Ej: 3"
        />

        <Text style={styles.label}>Ubicación (toca el mapa para mover el marcador)</Text>

        {/* Contenedor del mapa */}
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.miniMap}
            initialRegion={initialRegion}

            // Cuando el usuario toca el mapa guardamos las coordenadas
            onPress={(e) =>
              setCoord({
                lat: e.nativeEvent.coordinate.latitude,
                lng: e.nativeEvent.coordinate.longitude,
              })
            }
          >
            {/* Si hay coordenadas mostramos el marcador */}
            {coord && (
              <Marker
                coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                pinColor="#5CC2A3"
              />
            )}
          </MapView>
        </View>

        {/* Mostramos las coordenadas en texto si existen */}
        {coord && (
          <Text style={styles.coordsInfo}>
            📍 {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={saveStop}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? "ACTUALIZAR PARADA" : "GUARDAR PARADA"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F9F7", padding: 25 },
  mainTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 20,
    marginTop: 40,
  },
  label: {
    fontWeight: "700",
    color: "#5C9484",
    marginBottom: 8,
    fontSize: 14,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#2D3436",
    borderWidth: 1,
    borderColor: "#E0EDE9",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  mapWrapper: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "white",
    elevation: 5,
  },
  miniMap: { width: "100%", height: 240 },
  coordsInfo: {
    textAlign: "center",
    color: "#636E72",
    fontSize: 13,
    marginBottom: 25,
  },
  saveBtn: {
    backgroundColor: "#2D5A4C",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1.2,
  },
});
