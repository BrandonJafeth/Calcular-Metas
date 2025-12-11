# AGENTS.md - Daily Goals Tracker

## 📋 INFORMACIÓN DEL PROYECTO

### Descripción General
Aplicación web minimalista para tracking de metas diarias con estilo de matriz, diseñada siguiendo principios de UX/UI y heurísticas de Nielsen. Permite gestionar metas por persona y hora, calculando totales en tiempo real.

### Stack Tecnológico
- **Frontend**: React 18+ (Vite) + TypeScript
- **Estilos**: Tailwind CSS (Diseño Custom basado en especificaciones)
- **Estado**: React Context API + Hooks
- **Persistencia**: LocalStorage
- **Exportación**: Librerías para generación de Excel (.xlsx) y PDF
- **Iconografía**: Material Icons (o similar)
- **Testing**: Vitest + React Testing Library

---

## 🎯 REQUISITOS FUNCIONALES

### 1. Estructura de Matriz
- Sistema de tabla/matriz: Filas = Personas/Metas, Columnas = Franjas horarias.
- Diseño limpio tipo spreadsheet.
- Separadores sutiles.

### 2. Gestión de Personas/Metas
- Input para nombres de personas/metas.
- Botón (+) para añadir filas.
- Opción de eliminar filas con confirmación.
- Estado inicial: Mínimo 5 filas visibles.

### 3. Configuración Horaria
- Selector de rango horario (ej: 10:00 AM - 9:00 PM).
- Generación dinámica de columnas.
- Marcado de "Hora de almuerzo" (celdas deshabilitadas visualmente, excluidas de totales).

### 4. Input de Montos
- Validación numérica estricta.
- Formato de moneda automático.
- Placeholder sutil en celdas vacías.

### 5. Sistema de Totales (Tiempo Real)
- **Total Fila**: Suma horizontal.
- **Total Columna**: Suma vertical.
- **Gran Total**: Suma global (esquina inferior derecha).

### 6. Exportación
- Descargar Excel (.xlsx).
- Descargar PDF.
- Incluye todos los datos y totales calculados.

---

## 🎨 ESPECIFICACIONES VISUALES

### Paleta de Colores (Estilo Matriz)
| Elemento | Color | Hex |
|----------|-------|-----|
| Fondo Principal | Gris muy claro | `#FAFAFA` |
| Celdas | Blanco | `#FFFFFF` |
| Bordes | Gris claro | `#E0E0E0` |
| Texto Principal | Casi negro | `#212121` |
| Texto Secundario | Gris medio | `#757575` |
| Acento/Totales | Azul profesional | `#1976D2` |
| Pausas/Disabled | Gris fondo / texto | `#F5F5F5` / `#BDBDBD` |
| Hover | Gris muy claro | `#F5F5F5` |
| Totales (Fondo) | Azul claro | `#E3F2FD` |

### Tipografía
- **Fuente**: Inter, Roboto o SF Pro.
- **Headers**: 16px, Medium (500).
- **Body/Inputs**: 14px, Regular (400).
- **Totales**: 14px, Semibold (600).

### Espaciado y Layout
- **Padding celdas**: 12px vertical, 16px horizontal.
- **Altura fila**: 48px.
- **Border radius**: 8px (cards), 4px (inputs).
- **Margen secciones**: 24px.

---

## 🧠 PRINCIPIOS UX/UI (Heurísticas Nielsen)

1. **Visibilidad del estado**: Feedback visual inmediato al ingresar datos.
2. **Coincidencia con el mundo real**: Terminología clara (Hora, Meta, Total).
3. **Control y libertad**: Edición y eliminación libre.
4. **Consistencia**: Patrones visuales uniformes.
5. **Prevención de errores**: Validación de inputs numéricos.
6. **Reconocimiento vs recuerdo**: Iconografía intuitiva.
7. **Flexibilidad**: Navegación por teclado (Tab, Enter).
8. **Estética minimalista**: Solo lo esencial.
9. **Manejo de errores**: Mensajes claros.
10. **Ayuda**: Tooltips sutiles.

---

## 📁 ESTRUCTURA DE DIRECTORIOS SUGERIDA

```
src/
├── assets/                 # Recursos estáticos
├── components/
│   ├── common/            # Botones, Inputs, Tooltips genéricos
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── layout/            # Header, Footer, Layout principal
│   │   └── Header.tsx
│   └── matrix/            # Componentes específicos de la matriz
│       ├── MatrixGrid.tsx
│       ├── MatrixRow.tsx
│       ├── MatrixCell.tsx
│       ├── TimeConfig.tsx
│       └── TotalsDisplay.tsx
├── hooks/                 # Custom Hooks
│   ├── useMatrixData.ts   # Lógica de estado de la matriz
│   ├── useCalculations.ts # Lógica de sumas y totales
│   └── useLocalStorage.ts # Persistencia
├── types/                 # Definiciones TypeScript
│   └── index.ts
├── utils/                 # Utilidades puras
│   ├── currency.ts        # Formateo de moneda
│   ├── export.ts          # Lógica de Excel/PDF
│   └── time.ts            # Generación de rangos horarios
├── index.css              # Tailwind directives & global styles
├── App.tsx
└── main.tsx
```

---

## 🔧 CONVENCIONES DE DESARROLLO

### 1. Principios SOLID & Clean Code
- **Single Responsibility**: Cada componente debe hacer una sola cosa (ej: `MatrixCell` solo maneja la celda, no la lógica de toda la fila).
- **Custom Hooks**: Extraer lógica compleja a hooks (ej: cálculos de totales).

### 2. Manejo de Estado
- Usar `useReducer` o `Context` para el estado global de la matriz si crece la complejidad.
- Mantener el estado de UI (ej: modal abierto) separado del estado de datos (valores de metas).

### 3. Patrones de Componentes
```tsx
// ✅ Componente Funcional Tipado
interface MatrixCellProps {
  value: number;
  onChange: (val: number) => void;
  isDisabled?: boolean;
}

export const MatrixCell: React.FC<MatrixCellProps> = ({ value, onChange, isDisabled }) => {
  // Implementación...
};
```

### 4. Persistencia
- Guardar en `localStorage` en cada cambio significativo (con debounce para performance).
- Estructura de datos sugerida:
```typescript
interface MatrixState {
  timeRange: { start: string; end: string };
  breakHours: string[]; // IDs de horas de pausa
  rows: {
    id: string;
    name: string;
    values: Record<string, number>; // hourId -> amount
  }[];
}
```

### 5. Accesibilidad (a11y)
- Todos los inputs deben tener `aria-label`.
- Contraste de colores verificado según WCAG AA.
- Navegación completa por teclado soportada.

---

## 🧪 ESTRATEGIA DE TESTING

1. **Unit Testing (Vitest)**:
   - Validar funciones de cálculo (sumas correctas).
   - Validar formateo de moneda.
   - Validar generación de rangos horarios.

2. **Component Testing**:
   - Verificar que los inputs acepten solo números.
   - Verificar que los totales se actualicen al cambiar un input.

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Configuración inicial de Vite + TS.
- [ ] Configuración de Tailwind CSS y definición de tema (colores/fuentes).
- [ ] Implementación de estructura de datos y Hooks (`useMatrixData`).
- [ ] Componente `TimeConfig` (Selector de horas).
- [ ] Componente `MatrixGrid` (Renderizado dinámico).
- [ ] Lógica de cálculos en tiempo real.
- [ ] Persistencia en LocalStorage.
- [ ] Funcionalidad de Exportación (Excel/PDF).
- [ ] Revisión de Accesibilidad y Navegación por teclado.
