import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../services/supabase";
import { RootStackParamList } from "../../App";

// Tipo para tipar la navegación (para que TS no se queje)
type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {

  // Hook para poder navegar entre pantallas
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Estado del email que escribe el usuario
  const [email, setEmail] = useState("");

  // Estado de la contraseña
  const [password, setPassword] = useState("");

  // Estado para mostrar spinner mientras hace login
  const [loading, setLoading] = useState(false);

  // Mensaje de error que aparece debajo de los inputs
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * useEffect que se ejecuta una sola vez cuando se monta la pantalla
   * Sirve para comprobar si el usuario ya tiene sesión iniciada.
   * Si ya está logueado → lo mandamos directo a Tours.
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Función que pregunta a Supabase si hay sesión guardada
   * Esto evita que el usuario tenga que loguearse cada vez que abre la app.
   */
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigation.replace("Tours");
      }
    } catch (err) {
      console.log("Error al verificar sesión:", err);
    }
  };

  /**
   * Función que se ejecuta cuando el usuario pulsa el botón Entrar
   * Hace validaciones básicas y luego intenta login con Supabase.
   */
  const handleLogin = async () => {

    setErrorMessage("");

    // Validación simple para evitar campos vacíos
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor completa ambos campos");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({

        // trim() evita espacios accidentales
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setErrorMessage(error.message);
        Alert.alert("Error al iniciar sesión", error.message);
        return;
      }

      // Login correcto
      Alert.alert("¡Bienvenido!", "Has iniciado sesión correctamente");

      // replace evita que el usuario vuelva atrás al login
      navigation.replace("Tours");

    } catch (err: any) {

      console.error("Excepción en login:", err);

      setErrorMessage("Ocurrió un error inesperado. Intenta de nuevo.");

      Alert.alert("Error", "Ocurrió un error inesperado");

    } finally {

      // Pase lo que pase quitamos el loading
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* Título principal */}
        <Text style={styles.title}>Iniciar Sesión</Text>

        <Text style={styles.subtitle}>
          Usa tu correo electrónico y contraseña
        </Text>

        {/* Input de email */}
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          editable={!loading}
        />

        {/* Input de contraseña */}
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCorrect={false}
          editable={!loading}
        />

        {/* Mensaje de error si existe */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Spinner mientras carga */}
        {loading ? (
          <ActivityIndicator size="large" color="#5CC2A3" style={{ marginTop: 20 }} />
        ) : (

          // Botón de login
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        )}

        {/* Botón para ir a registro */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// Estilos visuales (solo diseño)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F9F7",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 32,
    shadowColor: "#2D5A4C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2D5A4C",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 32,
    textAlign: "center",
  },

  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#F2F9F7",
    borderWidth: 1,
    borderColor: "#E0F0E9",
    borderRadius: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: "#2D3436",
  },

  loginButton: {
    backgroundColor: "#5CC2A3",
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#5CC2A3",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  registerButton: {
    marginTop: 25,
    alignItems: "center",
    padding: 10,
  },

  registerText: {
    color: "#E67E22",
    fontWeight: "800",
    fontSize: 15,
  },

  errorText: {
    color: "#FF7675",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});
