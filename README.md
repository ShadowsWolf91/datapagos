# Sistema de Gestión de Pagos

## Descripción
Sistema de gestión de pagos semanales desarrollado con Node.js, Express y MongoDB.

## Requisitos
- Docker
- Docker Compose

## Despliegue con Docker

Para desplegar la aplicación utilizando Docker, sigue estos pasos:

1. Clona o descarga este repositorio en tu servidor físico

2. Navega hasta la carpeta del proyecto
   ```
   cd ruta/a/la/carpeta
   ```

3. Construye y levanta los contenedores con Docker Compose
   ```
   docker-compose up -d
   ```

4. La aplicación estará disponible en:
   ```
   http://localhost:3000
   ```

5. Para detener los contenedores:
   ```
   docker-compose down
   ```

## Persistencia de datos
Los datos de MongoDB se almacenan en un volumen Docker llamado `mongodb_data`, lo que garantiza que la información persista incluso después de reiniciar los contenedores.

## Credenciales por defecto
Usuario administrador:
- Email: admin@sistema.com
- Contraseña: admin123

## Configuración
Las variables de entorno están configuradas en el archivo docker-compose.yml. Si necesitas modificar alguna configuración, puedes editar este archivo antes de iniciar los contenedores.# datapagos
