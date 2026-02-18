# AppTour – Experiencia Guiada con Chat IA y Reportes

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.74+-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Rasa-Chatbot-green?style=for-the-badge" alt="Rasa" />
  <img src="https://img.shields.io/badge/Expo-Ready-orange?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
</p>

<p align="center">
  Aplicación móvil para **tours guiados** con chat conversacional impulsado por IA (Rasa) y generación automática de informes bonitos en HTML.
</p>

<p align="center">
  <strong>Chat estilo WhatsApp</strong> + <strong>Reportes listos para PDF</strong> con diseño moderno y responsive.
</p>

## ✨ Características principales

- Chat interactivo en tiempo real con backend **Rasa**
- Mensajes diferenciados: usuario (verde derecha) • bot (gris izquierda)
- Scroll automático al nuevo mensaje
- Manejo de errores de conexión con mensaje amigable
- Función para generar **informes HTML completos** de tours
  - Título personalizado
  - Lista numerada de paradas con orden
  - Descripciones
  - Imagen de portada opcional
  - Estilo limpio y profesional (CSS embebido)

## 🛠 Tecnologías y dependencias

| Tecnología / Librería     | Propósito                              | Notas                             |
|---------------------------|----------------------------------------|-----------------------------------|
| **React Native**          | Framework móvil cross-platform         | Versión ~0.74 o superior          |
| **TypeScript**            | Tipado estático y mejor DX             | Interfaces y tipos fuertes        |
| **React Hooks**           | Estado y refs (`useState`, `useRef`)   | Gestión ligera sin librerías      |
| **Fetch API**             | Comunicación con Rasa                  | Nativa, sin axios                 |
| **FlatList**              | Lista performante de mensajes          | Componente core de RN             |
| **StyleSheet**            | Estilos optimizados para mobile        | Similar a CSS pero nativo         |
| **Rasa**                  | Backend conversacional (externo)       | Servidor necesario                |

**Dependencias principales** (package.json aproximado – sin librerías pesadas externas):

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.74.5",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.0.0"
  }
}
