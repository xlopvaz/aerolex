# 05 · Fuentes y fiabilidad

> "Si está en AeroLex, tiene una fuente."

## 1. Jerarquía de fuentes

| Nivel | Tipo | Ejemplos | Uso |
|---|---|---|---|
| **1. Normativa y estándares** | ICAO, UE/EASA, FAA, WMO | Anexos ICAO (p. ej. Anexo 3 Meteorología, Anexo 10 Vol. II Comunicaciones), Doc 4444 PANS-ATM, Doc 8400 PANS-ABC, Doc 9432 Manual de Radiotelefonía; Reglamento (UE) 923/2012 (SERA), Easy Access Rules de EASA (Air Ops, Part-FCL, Part-CC); WMO-No. 306 *Manual on Codes* (METAR, SPECI, TAF) | Definiciones oficiales, formatos, fraseología |
| **2. Publicaciones oficiales de formación** | FAA, autoridades nacionales | FAA *Pilot's Handbook of Aeronautical Knowledge* (FAA-H-8083-25), *Airplane Flying Handbook* (FAA-H-8083-3), *Aviation Weather Handbook* (FAA-H-8083-28), *AIM* y *Pilot/Controller Glossary*; AIP España de ENAIRE (GEN 2.2, abreviaturas); publicaciones aeronáuticas de AEMET | Explicaciones, terminología EN/ES |
| **3. Fabricantes** | Documentación pública | Documentos *Aircraft Characteristics for Airport Planning* de Airbus y Boeing; fichas oficiales de ATR, Embraer, etc. | Dimensiones, motores, capacidades |
| **4. Investigación de accidentes** | Organismos oficiales | CIAIAC, BEA, NTSB, AAIB… | Casos de estudio |
| **5. Referencias reconocidas** | Secundarias | SKYbrary, libros de texto de ATPL, publicaciones del sector | Contexto, siempre contrastado con el nivel 1–3 |

Las webs sin autoría clara, los foros y las wikis abiertas **no** se usan como fuente única.

## 2. Derechos de autor de las fuentes

- **ICAO:** sus documentos tienen derechos de autor y se venden. **Se citan y se parafrasean**, nunca se copian en bloque.
- **FAA y otras agencias federales de EE. UU.:** sus obras son, en general, de dominio público en EE. UU. (17 U.S.C. § 105). Se pueden reutilizar con cita.
- **Legislación de la UE (EUR-Lex):** reutilizable citando la fuente. Además, las **versiones oficiales en español** de los reglamentos (SERA, Air Ops…) son una referencia excelente para traducciones correctas.
- **WMO:** publicaciones descargables gratuitamente; se citan.
- **Fabricantes, IATA y libros:** se citan y se parafrasean.
- **Imágenes:** solo con licencia libre verificada y atribución, o propias.

## 3. Reglas de contenido

1. **No se inventan datos**, normativa, procedimientos ni especificaciones. Si no se puede verificar, no se publica.
2. **Definición oficial ≠ explicación sencilla:** son campos separados y se muestran con etiquetas distintas.
3. **Diferencias regionales señaladas** con un callout `regional-diff` (por ejemplo, QNH en hPa frente a inHg, visibilidad en m frente a SM, *transition altitude* fija en EE. UU. frente a variable en Europa, SKC/CLR).
4. **Procedimientos operacionales:** se presentan como material educativo, con un callout `official-procedure` que remite al manual del operador o a la documentación aprobada.
5. **Términos que no se traducen:** se marcan con `keepOriginal` (METAR, MAYDAY, QNH, flaps…) y se explica su significado en español.
6. **Accidentes:** enfoque técnico, histórico y educativo, basado en el informe final oficial; sin sensacionalismo.

## 4. Flujo de revisión

```
draft  ──►  reviewed  ──►  verified
```

| Estado | Significado | Se muestra como |
|---|---|---|
| `draft` | Redactado (por ti, por un colaborador o con ayuda de IA) y con fuentes citadas, pero no contrastado línea a línea | Insignia "Borrador" |
| `reviewed` | Contrastado con las fuentes citadas | Insignia "Revisado" |
| `verified` | Revisado además por alguien con formación aeronáutica acreditada | Insignia "Verificado" |

**Transparencia:** el contenido que yo redacte entra como `draft`. Puedo citar las fuentes y ser cuidadoso, pero la verificación final contra el documento original debe hacerla una persona.

## 5. Avisos fijos

- **Pie de página:** *AeroLex es una plataforma educativa. No sustituye la formación reglada, el AFM/POH, el manual de operaciones del operador ni la documentación oficial vigente.*
- **Herramientas:** *Herramienta educativa. No apta para planificación ni uso operacional.*
- **Datos meteorológicos en directo:** origen, hora de emisión y el mismo aviso.
