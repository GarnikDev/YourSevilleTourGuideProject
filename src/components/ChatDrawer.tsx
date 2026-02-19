import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

// Este tipo define cómo es cada mensaje del chat
// Básicamente: id único, texto y si lo ha enviado el usuario o el bot
interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

// URL donde vive tu servidor de Rasa (el backend que responde al chat)
const RASA_URL = "https://jubilant-space-meme-5gjx76jq69prf79ww-5005.app.github.dev/";

export default function ChatDrawer() {

  // Aquí guardamos todos los mensajes del chat (usuario + bot)
  const [messages, setMessages] = useState<Message[]>([]);

  // Lo que el usuario está escribiendo ahora mismo en el input
  const [inputText, setInputText] = useState('');

  // Referencia a la lista para poder hacer scroll automático al final
  const flatListRef = useRef<FlatList>(null);

  /**
   * Función que se ejecuta cuando el usuario pulsa "Send"
   * Hace varias cosas:
   * 1. Añade el mensaje del usuario al chat
   * 2. Lo envía al servidor de Rasa
   * 3. Recibe la respuesta del bot y la añade también
   */
  const sendMessage = async () => {

    // Si el usuario no ha escrito nada (o solo espacios), no hacemos nada
    if (!inputText.trim()) return;

    // Creamos el mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(), // usamos el tiempo como id rápido
      text: inputText,
      isUser: true,
    };

    // Lo añadimos a la lista de mensajes
    setMessages((prev) => [...prev, userMessage]);

    // Limpiamos el input
    setInputText('');

    try {
      // Petición al servidor de Rasa
      const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        // sender puede ser dinámico si tienes usuarios reales
        body: JSON.stringify({
          sender: 'user',
          message: inputText,
        }),
      });

      // Si algo falla en el servidor, lanzamos error
      if (!response.ok) {
        throw new Error('Rasa response error');
      }

      // Rasa puede devolver varios mensajes, por eso es array
      const data: { text?: string }[] = await response.json();

      // Recorremos todas las respuestas del bot
      data.forEach((msg) => {

        // Si el mensaje tiene texto lo mostramos
        if (msg.text) {
          const botMessage: Message = {
            id: Date.now().toString(),
            text: msg.text,
            isUser: false,
          };

          // Lo añadimos al chat
          setMessages((prev) => [...prev, botMessage]);
        }

        // Aquí podrías manejar imágenes, botones, etc. si quieres
      });

    } catch (error) {

      console.error(error);

      // Mensaje de error si no se puede conectar con Rasa
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Error connecting to Rasa. Please try again.',
        isUser: false,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <View style={styles.container}>

      {/* Título arriba del chat */}
      <Text style={styles.title}>Chat with Rasa</Text>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}

        // Cómo se pinta cada mensaje
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.isUser ? styles.userMessage : styles.botMessage
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}

        // Cada vez que cambia el tamaño hacemos scroll abajo automático
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Zona de escribir mensaje + botón */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question..."
        />
        <Button title="Send" onPress={sendMessage}/>
      </View>

    </View>
  );
}

// Estilos básicos (colores, márgenes, etc.)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },

  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%'
  },

  // Mensajes del usuario (derecha, verde tipo WhatsApp)
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6'
  },

  // Mensajes del bot (izquierda, gris)
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ececec'
  },

  messageText: { fontSize: 14 },

  // Zona inferior de input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 50
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10
  },
});
