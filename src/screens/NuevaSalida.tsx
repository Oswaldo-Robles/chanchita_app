import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { generarId } from '../domain/id';
import {
  asegurarOrganizador,
  crearOrganizador,
  esBorradorVacio,
  fechaHoyISO,
  validarSalida,
  yaEstaAgregado,
} from '../domain/salidas';
import type { Participante } from '../domain/types';
import AgregarParticipante from './AgregarParticipante';
import { Boton, Entrada, Etiqueta, TextoError } from './ui';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaSalida'>;

export default function NuevaSalida({ navigation }: Props) {
  const { perfil, salidas, borrador } = useApp();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(fechaHoyISO());
  const [participantes, setParticipantes] = useState<Participante[]>(() =>
    perfil ? [crearOrganizador(perfil)] : [],
  );
  const [errores, setErrores] = useState<{ nombre?: string; fecha?: string; participantes?: string }>(
    {},
  );
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // El borrador se guarda solo cuando ya terminó de cargar el anterior (si no, lo pisaríamos vacío).
  const borradorCargado = useRef(false);

  useEffect(() => {
    borrador.leer().then((guardado) => {
      if (guardado && perfil) {
        setNombre(guardado.nombre);
        setFecha(guardado.fecha);
        setParticipantes(asegurarOrganizador(guardado.participantes, perfil));
      }
      borradorCargado.current = true;
    });
  }, [borrador, perfil]);

  // Cada cambio se guarda: así no se pierde al retroceder ni al cerrar la app.
  useEffect(() => {
    if (!borradorCargado.current) return;
    if (esBorradorVacio(nombre, participantes)) void borrador.borrar();
    else void borrador.guardar({ nombre, fecha, participantes });
  }, [nombre, fecha, participantes, borrador]);

  function empezarDeNuevo() {
    setNombre('');
    setFecha(fechaHoyISO());
    setErrores({});
    if (perfil) setParticipantes([crearOrganizador(perfil)]);
  }

  function agregar(nombreNuevo: string, telefono?: string): string | null {
    if (yaEstaAgregado(participantes, nombreNuevo, telefono)) {
      return `${nombreNuevo} ya está en la salida`;
    }
    setParticipantes((prev) => [...prev, { id: generarId(), nombre: nombreNuevo, telefono }]);
    return null;
  }

  function quitar(id: string) {
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  }

  async function crear() {
    const r = validarSalida(nombre, fecha, participantes);
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    setErrores({});
    setGuardando(true);
    try {
      const salida = {
        id: generarId(),
        nombre: nombre.trim(),
        fecha,
        participantes,
        gastos: [],
      };
      await salidas.guardar(salida);
      borradorCargado.current = false; // evita que el efecto vuelva a guardar el borrador
      await borrador.borrar();
      navigation.replace('DetalleSalida', { salidaId: salida.id });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      {!esBorradorVacio(nombre, participantes) && (
        <View className="flex-row items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
          <Text className="text-sm text-slate-600 dark:text-slate-400">
            Borrador guardado automáticamente
          </Text>
          <Pressable onPress={empezarDeNuevo} hitSlop={10}>
            <Text className="text-sm font-semibold text-primary-700 dark:text-primary-400">
              Empezar de nuevo
            </Text>
          </Pressable>
        </View>
      )}

      <Etiqueta>Nombre de la salida</Etiqueta>
      <Entrada
        conError={!!errores.nombre}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Pizza del viernes"
      />
      {errores.nombre && <TextoError>{errores.nombre}</TextoError>}

      <Etiqueta>Fecha</Etiqueta>
      <Entrada
        conError={!!errores.fecha}
        value={fecha}
        onChangeText={setFecha}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      {errores.fecha && <TextoError>{errores.fecha}</TextoError>}

      <Etiqueta>{`Participantes (${participantes.length})`}</Etiqueta>
      {participantes.map((p) => (
        <View
          key={p.id}
          className="flex-row items-center border-b border-slate-200 py-3 dark:border-slate-700"
        >
          <View className="flex-1">
            <Text className="text-base font-medium text-slate-900 dark:text-slate-50">
              {p.nombre}
              {p.esOrganizador ? ' (tú)' : ''}
            </Text>
            <Text className="mt-0.5 text-slate-600 dark:text-slate-400">
              {p.telefono ?? 'sin celular'}
            </Text>
          </View>
          {!p.esOrganizador && (
            <Pressable onPress={() => quitar(p.id)} hitSlop={10}>
              <Text className="font-semibold text-danger-700 dark:text-danger-500">Quitar</Text>
            </Pressable>
          )}
        </View>
      ))}
      {errores.participantes && <TextoError>{errores.participantes}</TextoError>}

      <Boton
        texto="+ Agregar participante"
        variante="secundario"
        className="mt-4"
        onPress={() => setAgregando(true)}
      />
      <Boton texto="Crear salida" className="mt-5" onPress={crear} deshabilitado={guardando} />

      <AgregarParticipante
        visible={agregando}
        participantes={participantes}
        onCerrar={() => setAgregando(false)}
        onAgregar={agregar}
      />
    </ScrollView>
  );
}
