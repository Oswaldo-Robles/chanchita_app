import { Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { useTema } from './tema';

type BotonProps = {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  className?: string;
};

/** Botón de acción: el primario es la acción principal de la pantalla. */
export function Boton({ texto, onPress, variante = 'primario', deshabilitado, className }: BotonProps) {
  const primario = variante === 'primario';
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      className={[
        'items-center rounded-xl px-4 py-3.5',
        primario
          ? 'bg-primary-600 active:bg-primary-700'
          : 'border border-primary-600 active:bg-primary-50 dark:border-primary-400 dark:active:bg-slate-800',
        deshabilitado ? 'opacity-60' : '',
        className ?? '',
      ].join(' ')}
    >
      <Text
        className={
          primario
            ? 'text-base font-bold text-white'
            : 'text-base font-semibold text-primary-700 dark:text-primary-400'
        }
      >
        {texto}
      </Text>
    </Pressable>
  );
}

/** Campo de texto; con `conError` el borde se vuelve rojo. */
export function Entrada({ conError, ...props }: TextInputProps & { conError?: boolean }) {
  const { placeholder } = useTema();
  return (
    <TextInput
      placeholderTextColor={placeholder}
      className={[
        'rounded-xl border bg-white px-3.5 py-3 text-base text-slate-900 dark:bg-slate-800 dark:text-slate-50',
        conError ? 'border-danger-600 dark:border-danger-500' : 'border-slate-300 dark:border-slate-600',
      ].join(' ')}
      {...props}
    />
  );
}

export function Etiqueta({ children }: { children: string }) {
  return (
    <Text className="mb-1.5 mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {children}
    </Text>
  );
}

export function TextoError({ children }: { children: string }) {
  return <Text className="mt-1 text-sm text-danger-700 dark:text-danger-500">{children}</Text>;
}

// Los avatares alternan rosa y cian para distinguir a las personas de un vistazo.
const AVATAR = [
  'bg-primary-100 dark:bg-primary-900',
  'bg-accent-100 dark:bg-accent-900',
];
const AVATAR_TEXTO = [
  'text-primary-700 dark:text-primary-100',
  'text-accent-900 dark:text-accent-100',
];

/** Círculo con la inicial del nombre; `indice` elige el color. */
export function Avatar({ nombre, indice, className }: { nombre: string; indice: number; className?: string }) {
  const i = indice % AVATAR.length;
  return (
    <View className={`h-8 w-8 items-center justify-center rounded-full ${AVATAR[i]} ${className ?? ''}`}>
      <Text className={`text-sm font-bold ${AVATAR_TEXTO[i]}`}>
        {nombre.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}
