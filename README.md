
URL web: https://f1stats-rust.vercel.app/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Estadísticas de temporada

El calendario y la ruta `/estadisticas` permiten consultar temporadas desde
2023. La aplicación obtiene el calendario de OpenF1 y muestra las clasificaciones
de pilotos y constructores usando los resultados guardados en la base de datos.
Incluye puntos, victorias, podios y carreras, con desempate por posiciones de
finalización.

Si una temporada no tiene resultados locales, la aplicación intenta importarlos
desde OpenF1 antes de mostrar la información. Los resultados disponibles quedan
guardados en la base local; las carreras futuras o sin resultados publicados
siguen sin clasificación. Si la importación falla, la página muestra un aviso y
el error queda registrado en el servidor.

La página `/corredores` muestra los pilotos de cada temporada, sus equipos,
números e imágenes obtenidas de OpenF1.
Cada tarjeta abre `/corredores/[season]/[code]`, con imagen de mayor
resolución, identificador visual de la escudería y estadísticas de temporada y
trayectoria calculadas a partir de resultados importados.

Desde las temporadas con resultados importados se puede abrir la clasificación
detallada de cada carrera. Los nombres de los pilotos enlazan a
`/pilotos/[driverId]`, donde se muestran sus estadísticas de trayectoria y los
resultados importados.

## Predicciones y ranking

Los usuarios con sesión iniciada pueden pronosticar el podio de la próxima
carrera hasta su hora de inicio y modificar su predicción mientras siga abierto
el plazo. Cada posición acertada suma 3 puntos; acertar el podio completo en el
orden exacto suma 6 puntos extra, para un total de 15. La página `/ranking`
muestra los puntos acumulados de todos los usuarios según los resultados
importados.

Para habilitar esta función en una base de datos, aplicar las migraciones
pendientes con `npx prisma migrate deploy` desde el entorno configurado para esa
base.

La ruta `/api/season-import` permite iniciar una importación manual desde 2023
o desde el año indicado en el parámetro `year`. Cada desarrollador debe usar su
propia configuración local de PostgreSQL; las credenciales de conexión no se
comparten mediante Git.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
