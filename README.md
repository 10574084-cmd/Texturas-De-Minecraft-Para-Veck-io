# Texturas de Minecraft para Veck.io

Repositorio para desarrollar un prototipo visual estilo Minecraft para Veck.io mediante Tampermonkey.

## Primer prototipo

Archivo: [VeckMinecraft.user.js](./VeckMinecraft.user.js)

Incluye:
- Panel movible y plegable.
- Vista previa pixelada de Steve estilo voxel.
- Hotbar de bloques de prueba.
- Añadir/quitar bloques solo en la vista previa local.
- Diagnóstico básico del canvas y del puente Unity.

## Instalar en Tampermonkey

1. Abre [VeckMinecraft.user.js](./VeckMinecraft.user.js) en GitHub.
2. Copia el contenido.
3. En Tampermonkey, crea un script nuevo, pega el código y guarda.
4. Recarga https://veck.io/.

## Límites de esta versión

Esta es la fase visual inicial, no un mod integrado en la escena 3D del juego. La vista previa no coloca bloques en el mundo real, no modifica colisiones y no sincroniza a otros jugadores. Para llegar a eso hay que identificar una integración real con los objetos de Unity y la lógica del juego; el loader por sí solo no revela esos detalles.

El archivo Texturas.zip está en el repositorio, pero este prototipo aún no extrae ni aplica automáticamente sus imágenes. Cuando el pack esté descomprimido en PNG individuales, se pueden conectar como texturas del renderizador.

## Próximos pasos

1. Revisar el contenido de Texturas.zip y mapear los nombres de las imágenes.
2. Confirmar si hay un punto de integración estable con la escena Unity.
3. Solo después, reemplazar la vista previa por modelos y bloques en el mundo. No se afirmará que hay sincronización multijugador hasta probarla con dos clientes.
