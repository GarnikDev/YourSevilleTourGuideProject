import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { generateTourReportHTML } from '../components/GenerateTourReport';

// Esta función se encarga de generar un PDF del tour y luego permitir compartirlo
export const generateAndShareTourPDF = async (
  tourTitle: string,
  stops: Array<{ title: string; description?: string; stop_order: number }>,
  coverImageUrl?: string   // si hay imagen de portada la usamos, si no, no pasa nada
) => {
  try {
    // Generamos el HTML del informe usando la función que ya tenías
    const html = generateTourReportHTML(tourTitle, stops, coverImageUrl);

    // Convertimos el HTML en un archivo PDF local
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,  // tamaño A4 aprox en puntos
      height: 842,
    });

    // Revisamos si el dispositivo puede compartir archivos
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      // Abrimos el menú de compartir para enviar el PDF
      await Sharing.shareAsync(uri, {
        dialogTitle: `Informe del tour: ${tourTitle}`,
        mimeType: 'application/pdf',
      });
    } else {
      // Si no se puede compartir, avisamos al usuario
      Alert.alert('No disponible', 'Compartir no está disponible en este dispositivo.');
    }
  } catch (error) {
    // Capturamos cualquier error y avisamos en consola y con alerta
    console.error('Error generando PDF:', error);
    Alert.alert('Error', 'No se pudo generar el informe PDF.');
  }
};
