# limits_IT_regions.geojson

Confini amministrativi delle 20 regioni italiane.

- **Fonte:** [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy),
  file `geojson/limits_IT_regions.geojson`
- **Licenza a monte:** i dati derivano dai confini ISTAT, rilasciati da Openpolis
  con licenza CC-BY 4.0
- **Scaricato:** 2026-08-15
- **Modifica applicata:** coordinate arrotondate a 4 decimali (~11 m di
  precisione, ampiamente sufficiente a scala regionale). Ha ridotto il file da
  2,70 MB a 1,19 MB. Nessun'altra alterazione: 20 feature, proprieta' originali.

Il file e' vendorizzato invece di essere scaricato a runtime da GitHub: evita
una dipendenza di rete per il funzionamento della mappa e rende l'applicazione
utilizzabile offline.
