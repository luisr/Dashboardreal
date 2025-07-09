import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Firebase imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

// Definição dos temas com paletas de cores
const themes = {
  light: {
    name: "Claro",
    background: "#F3F4F6", // gray-100
    cardBackground: "#FFFFFF",
    textColor: "#1F2937", // gray-900
    secondaryTextColor: "#4B5563", // gray-600
    primaryColor: "#3B82F6", // blue-500
    secondaryColor: "#10B981", // green-500
    accentColor: "#8B5CF6", // purple-500
    dangerColor: "#EF4444", // red-500
    warningColor: "#F59E0B", // yellow-500
    chartPrimary: "#8884d8",
    chartSecondary: "#82ca9d",
    chartAccent: "#ff7300",
    chartPriority: "#3f51b5",
    chartRisk: "#e91e63",
    tableHeaderBg: "#F9FAFB", // gray-50
    tableBorder: "#E5E7EB", // gray-200
  },
  dark: {
    name: "Escuro",
    background: "#1F2937", // gray-900
    cardBackground: "#374151", // gray-700
    textColor: "#F9FAFB", // gray-50
    secondaryTextColor: "#D1D5DB", // gray-300
    primaryColor: "#60A5FA", // blue-400
    secondaryColor: "#34D399", // green-400
    accentColor: "#A78BFA", // purple-400
    dangerColor: "#F87171", // red-400
    warningColor: "#FBBF24", // yellow-400
    chartPrimary: "#A78BFA", // purple-400
    chartSecondary: "#34D399", // green-400
    chartAccent: "#FBBF24", // yellow-400
    chartPriority: "#60A5FA", // blue-400
    chartRisk: "#F87171", // red-400
    tableHeaderBg: "#4B5563", // gray-600
    tableBorder: "#6B7280", // gray-500
  },
  "blue-green": {
    name: "Azul-Verde",
    background: "#E0F2F7", // light blue
    cardBackground: "#FFFFFF",
    textColor: "#2C3E50", // dark blue-gray
    secondaryTextColor: "#5D6D7E",
    primaryColor: "#3498DB", // strong blue
    secondaryColor: "#2ECC71", // strong green
    accentColor: "#9B59B6", // purple
    dangerColor: "#E74C3C", // red
    warningColor: "#F39C12", // orange
    chartPrimary: "#3498DB",
    chartSecondary: "#2ECC71",
    chartAccent: "#F39C12",
    chartPriority: "#34495E",
    chartRisk: "#E74C3C",
    tableHeaderBg: "#ECF0F1",
    tableBorder: "#BDC3C7",
  },
};

// Função auxiliar para calcular a luminância de uma cor hexadecimal
const getLuminance = (hexColor: string) => {
  const hex = hexColor.substring(1); // Remove #
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Componente para o Modal de Edição de Atividade
const EditActivityModal = ({
  activity,
  onClose,
  onSave,
  customStatuses,
  customRisks,
  currentTheme,
}) => {
  // Estado local para os dados da atividade no modal
  const [editedActivity, setEditedActivity] = useState(activity);

  // Efeito para atualizar o estado local se a atividade prop mudar (ex: ao abrir para outra atividade)
  useEffect(() => {
    setEditedActivity(activity);
  }, [activity]);

  // Lida com a mudança nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedActivity((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Lida com o salvamento das alterações
  const handleSave = () => {
    onSave(editedActivity);
    onClose(); // Fecha o modal após salvar
  };

  if (!activity) return null; // Não renderiza se não houver atividade para editar

  // Opções de status padrão
  const defaultStatuses = [
    "Concluído",
    "Em Andamento",
    "Atrasado",
    "Não Iniciado",
  ];
  // Combina status padrão com status personalizados, removendo duplicatas
  const allStatuses = [
    ...new Set([...defaultStatuses, ...customStatuses.map((s) => s.name)]),
  ];

  // Opções de risco padrão
  const defaultRisks = ["Alto", "Média", "Baixo"];
  // Combina riscos padrão com riscos personalizados, removendo duplicatas
  const allRisks = [
    ...new Set([...defaultRisks, ...customRisks.map((r) => r.name)]),
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: currentTheme.background }}
    >
      <div
        className="rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: currentTheme.cardBackground,
          color: currentTheme.textColor,
        }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.textColor }}
        >
          Editar Atividade: {editedActivity.atividade}
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campos de texto */}
          <div className="col-span-1">
            <label
              htmlFor="atividade"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Atividade
            </label>
            <input
              type="text"
              name="atividade"
              id="atividade"
              value={editedActivity.atividade}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="disciplina"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Disciplina
            </label>
            <input
              type="text"
              name="disciplina"
              id="disciplina"
              value={editedActivity.disciplina}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="responsavel"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Responsável
            </label>
            <input
              type="text"
              name="responsavel"
              id="responsavel"
              value={editedActivity.responsavel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>

          {/* Campos de seleção (Prioridade, Status) */}
          <div className="col-span-1">
            <label
              htmlFor="prioridade"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Prioridade
            </label>
            <select
              name="prioridade"
              id="prioridade"
              value={editedActivity.prioridade}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
          <div className="col-span-1">
            <label
              htmlFor="statusPlanejado"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Status Planejado
            </label>
            <select
              name="statusPlanejado"
              id="statusPlanejado"
              value={editedActivity.statusPlanejado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label
              htmlFor="statusReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Status Real
            </label>
            <select
              name="statusReal"
              id="statusReal"
              value={editedActivity.statusReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de data */}
          <div className="col-span-1">
            <label
              htmlFor="dataInicialPlanejada"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Inicial Planejada
            </label>
            <input
              type="date"
              name="dataInicialPlanejada"
              id="dataInicialPlanejada"
              value={editedActivity.dataInicialPlanejada}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="dataFinalPlanejada"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Final Planejada
            </label>
            <input
              type="date"
              name="dataFinalPlanejada"
              id="dataFinalPlanejada"
              value={editedActivity.dataFinalPlanejada}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="dataInicialReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Inicial Real
            </label>
            <input
              type="date"
              name="dataInicialReal"
              id="dataInicialReal"
              value={editedActivity.dataInicialReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="dataFinalReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Final Real
            </label>
            <input
              type="date"
              name="dataFinalReal"
              id="dataFinalReal"
              value={editedActivity.dataFinalReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>

          {/* Campos numéricos (valores, percentual) */}
          <div className="col-span-1">
            <label
              htmlFor="valorPlanejado"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Valor Planejado (R$)
            </label>
            <input
              type="number"
              name="valorPlanejado"
              id="valorPlanejado"
              value={editedActivity.valorPlanejado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="valorReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Valor Real (R$)
            </label>
            <input
              type="number"
              name="valorReal"
              id="valorReal"
              value={editedActivity.valorReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="custoReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Custo Real (R$)
            </label>
            <input
              type="number"
              name="custoReal"
              id="custoReal"
              value={editedActivity.custoReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="percentualConclusao"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Conclusão (%)
            </label>
            <input
              type="number"
              name="percentualConclusao"
              id="percentualConclusao"
              value={editedActivity.percentualConclusao}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>

          {/* Campos de texto longo */}
          <div className="col-span-full">
            <label
              htmlFor="observacoes"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Observações
            </label>
            <textarea
              name="observacoes"
              id="observacoes"
              value={editedActivity.observacoes}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            ></textarea>
          </div>
          <div className="col-span-full">
            <label
              htmlFor="dependencias"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Dependências (separadas por vírgula)
            </label>
            <input
              type="text"
              name="dependencias"
              id="dependencias"
              value={editedActivity.dependencias.join(", ")}
              onChange={(e) =>
                setEditedActivity((prev) => ({
                  ...prev,
                  dependencias: e.target.value
                    .split(",")
                    .map((dep) => dep.trim()),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-full">
            <label
              htmlFor="recursosNecessarios"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Recursos Necessários (separadas por vírgula)
            </label>
            <input
              type="text"
              name="recursosNecessarios"
              id="recursosNecessarios"
              value={editedActivity.recursosNecessarios.join(", ")}
              onChange={(e) =>
                setEditedActivity((prev) => ({
                  ...prev,
                  recursosNecessarios: e.target.value
                    .split(",")
                    .map((res) => res.trim()),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="riscoAssociado"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Risco Associado
            </label>
            <select
              name="riscoAssociado"
              id="riscoAssociado"
              value={editedActivity.riscoAssociado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {allRisks.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label
              htmlFor="linkDocumento"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Link/Documento de Apoio
            </label>
            <input
              type="text"
              name="linkDocumento"
              id="linkDocumento"
              value={editedActivity.linkDocumento}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="dataUltimaAtualizacao"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Última Atualização
            </label>
            <input
              type="date"
              name="dataUltimaAtualizacao"
              id="dataUltimaAtualizacao"
              value={editedActivity.dataUltimaAtualizacao}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
        </form>

        {/* Botões do Modal */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            style={{
              backgroundColor: currentTheme.cardBackground,
              color: currentTheme.textColor,
              borderColor: currentTheme.tableBorder,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
            style={{
              backgroundColor: currentTheme.primaryColor,
              color: currentTheme.textColor,
            }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para o Modal de Adição de Atividade
const AddActivityModal = ({
  onClose,
  onSave,
  customStatuses,
  customRisks,
  currentTheme,
}) => {
  // Estado local para os dados da nova atividade
  const [newActivity, setNewActivity] = useState({
    atividade: "",
    disciplina: "",
    dataInicialPlanejada: "",
    dataFinalPlanejada: "",
    dataInicialReal: "",
    dataFinalReal: "",
    valorPlanejado: 0,
    valorReal: 0,
    statusPlanejado: "Não Iniciado",
    statusReal: "Não Iniciado",
    responsavel: "",
    prioridade: "Média",
    observacoes: "",
    dependencias: [],
    custoReal: 0,
    recursosNecessarios: [],
    percentualConclusao: 0,
    riscoAssociado: "Baixo",
    linkDocumento: "",
    dataUltimaAtualizacao: new Date().toISOString().split("T")[0], // Data atual por padrão
  });

  // Lida com a mudança nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewActivity((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Lida com o salvamento da nova atividade
  const handleSave = () => {
    onSave({ ...newActivity, id: Date.now() }); // Gera um ID único simples
    onClose(); // Fecha o modal após salvar
  };

  // Opções de status padrão
  const defaultStatuses = [
    "Concluído",
    "Em Andamento",
    "Atrasado",
    "Não Iniciado",
  ];
  // Combina status padrão com status personalizados, removendo duplicatas
  const allStatuses = [
    ...new Set([...defaultStatuses, ...customStatuses.map((s) => s.name)]),
  ];

  // Opções de risco padrão
  const defaultRisks = ["Alto", "Média", "Baixo"];
  // Combina riscos padrão com riscos personalizados, removendo duplicatas
  const allRisks = [
    ...new Set([...defaultRisks, ...customRisks.map((r) => r.name)]),
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: currentTheme.background }}
    >
      <div
        className="rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: currentTheme.cardBackground,
          color: currentTheme.textColor,
        }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.textColor }}
        >
          Adicionar Nova Atividade
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campos de texto */}
          <div className="col-span-1">
            <label
              htmlFor="new-atividade"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Atividade
            </label>
            <input
              type="text"
              name="atividade"
              id="new-atividade"
              value={newActivity.atividade}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-disciplina"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Disciplina
            </label>
            <input
              type="text"
              name="disciplina"
              id="new-disciplina"
              value={newActivity.disciplina}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-responsavel"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Responsável
            </label>
            <input
              type="text"
              name="responsavel"
              id="new-responsavel"
              value={newActivity.responsavel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>

          {/* Campos de seleção (Prioridade, Status) */}
          <div className="col-span-1">
            <label
              htmlFor="new-prioridade"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Prioridade
            </label>
            <select
              name="prioridade"
              id="new-prioridade"
              value={newActivity.prioridade}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-statusPlanejado"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Status Planejado
            </label>
            <select
              name="statusPlanejado"
              id="new-statusPlanejado"
              value={newActivity.statusPlanejado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-statusReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Status Real
            </label>
            <select
              name="statusReal"
              id="new-statusReal"
              value={newActivity.statusReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de data */}
          <div className="col-span-1">
            <label
              htmlFor="new-dataInicialPlanejada"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Inicial Planejada
            </label>
            <input
              type="date"
              name="dataInicialPlanejada"
              id="new-dataInicialPlanejada"
              value={newActivity.dataInicialPlanejada}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-dataFinalPlanejada"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Final Planejada
            </label>
            <input
              type="date"
              name="dataFinalPlanejada"
              id="new-dataFinalPlanejada"
              value={newActivity.dataFinalPlanejada}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-dataInicialReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Inicial Real
            </label>
            <input
              type="date"
              name="dataInicialReal"
              id="new-dataInicialReal"
              value={newActivity.dataInicialReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-dataFinalReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Final Real
            </label>
            <input
              type="date"
              name="dataFinalReal"
              id="new-dataFinalReal"
              value={newActivity.dataFinalReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>

          {/* Campos numéricos (valores, percentual) */}
          <div className="col-span-1">
            <label
              htmlFor="new-valorPlanejado"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Valor Planejado (R$)
            </label>
            <input
              type="number"
              name="valorPlanejado"
              id="new-valorPlanejado"
              value={newActivity.valorPlanejado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-valorReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Valor Real (R$)
            </label>
            <input
              type="number"
              name="valorReal"
              id="new-valorReal"
              value={newActivity.valorReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-custoReal"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Custo Real (R$)
            </label>
            <input
              type="number"
              name="custoReal"
              id="new-custoReal"
              value={newActivity.custoReal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-percentualConclusao"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Conclusão (%)
            </label>
            <input
              type="number"
              name="percentualConclusao"
              id="new-percentualConclusao"
              value={newActivity.percentualConclusao}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>

          {/* Campos de texto longo */}
          <div className="col-span-full">
            <label
              htmlFor="new-observacoes"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Observações
            </label>
            <textarea
              name="observacoes"
              id="new-observacoes"
              value={newActivity.observacoes}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            ></textarea>
          </div>
          <div className="col-span-full">
            <label
              htmlFor="new-dependencias"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Dependências (separadas por vírgula)
            </label>
            <input
              type="text"
              name="dependencias"
              id="new-dependencias"
              value={newActivity.dependencias.join(", ")}
              onChange={(e) =>
                setNewActivity((prev) => ({
                  ...prev,
                  dependencias: e.target.value
                    .split(",")
                    .map((dep) => dep.trim()),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-full">
            <label
              htmlFor="new-recursosNecessarios"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Recursos Necessários (separadas por vírgula)
            </label>
            <input
              type="text"
              name="recursosNecessarios"
              id="new-recursosNecessarios"
              value={newActivity.recursosNecessarios.join(", ")}
              onChange={(e) =>
                setNewActivity((prev) => ({
                  ...prev,
                  recursosNecessarios: e.target.value
                    .split(",")
                    .map((res) => res.trim()),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-riscoAssociado"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Risco Associado
            </label>
            <select
              name="riscoAssociado"
              id="new-riscoAssociado"
              value={newActivity.riscoAssociado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {allRisks.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-linkDocumento"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Link/Documento de Apoio
            </label>
            <input
              type="text"
              name="linkDocumento"
              id="new-linkDocumento"
              value={newActivity.linkDocumento}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="new-dataUltimaAtualizacao"
              className="block text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Última Atualização
            </label>
            <input
              type="date"
              name="dataUltimaAtualizacao"
              id="new-dataUltimaAtualizacao"
              value={newActivity.dataUltimaAtualizacao}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            />
          </div>
        </form>

        {/* Botões do Modal */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            style={{
              backgroundColor: currentTheme.cardBackground,
              color: currentTheme.textColor,
              borderColor: currentTheme.tableBorder,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
            style={{
              backgroundColor: currentTheme.primaryColor,
              color: currentTheme.textColor,
            }}
          >
            Adicionar Atividade
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para o Heatmap
const Heatmap = ({ data, rowLabels, colLabels, maxCount, currentTheme }) => {
  // Função para determinar a cor de fundo de uma célula com base na contagem
  const getColor = (count) => {
    if (maxCount === 0) return currentTheme.tableHeaderBg; // Cor padrão se não houver dados
    const intensity = count / maxCount;
    // Escala de cores baseada no tema
    if (intensity === 0) return currentTheme.tableHeaderBg;
    // Interpolação de cor para intensidade
    const r = parseInt(currentTheme.primaryColor.substring(1, 3), 16);
    const g = parseInt(currentTheme.primaryColor.substring(3, 5), 16);
    const b = parseInt(currentTheme.primaryColor.substring(5, 7), 16);

    const r_bg = parseInt(currentTheme.tableHeaderBg.substring(1, 3), 16);
    const g_bg = parseInt(currentTheme.tableHeaderBg.substring(3, 5), 16);
    const b_bg = parseInt(currentTheme.tableHeaderBg.substring(5, 7), 16);

    const interpolatedR = Math.round(r_bg + (r - r_bg) * intensity);
    const interpolatedG = Math.round(g_bg + (g - g_bg) * intensity);
    const interpolatedB = Math.round(b_bg + (b - b_bg) * intensity);

    return `rgb(${interpolatedR}, ${interpolatedG}, ${interpolatedB})`;
  };

  return (
    <div className="overflow-x-auto">
      {" "}
      {/* Permite rolagem horizontal se o conteúdo for muito largo */}
      <div className="inline-flex flex-col min-w-full">
        {" "}
        {/* Garante que o container se expande para o conteúdo */}
        {/* Linha do Cabeçalho: Canto vazio + Rótulos das Colunas (Responsaveis) */}
        <div className="flex flex-row">
          <div
            className="w-32 flex-shrink-0"
            style={{ backgroundColor: currentTheme.tableHeaderBg }}
          ></div>{" "}
          {/* Espaço vazio para alinhar com os rótulos das linhas */}
          {colLabels.map((label) => (
            <div
              key={label}
              className="flex-1 p-2 text-center text-xs font-semibold border rounded-t-md"
              style={{
                backgroundColor: currentTheme.tableHeaderBg,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        {/* Linhas de Dados: Rótulo da Linha (Disciplina) + Células do Heatmap */}
        {rowLabels.map((rowLabel) => (
          <div key={rowLabel} className="flex flex-row">
            <div
              className="w-32 p-2 text-right text-xs font-semibold border rounded-l-md flex-shrink-0"
              style={{
                backgroundColor: currentTheme.tableHeaderBg,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {rowLabel}
            </div>
            {colLabels.map((colLabel) => (
              <div
                key={`${rowLabel}-${colLabel}`}
                className={`flex-1 p-2 text-center text-sm font-medium border rounded-sm`}
                style={{
                  backgroundColor: getColor(data[rowLabel]?.[colLabel] || 0),
                  color:
                    getLuminance(getColor(data[rowLabel]?.[colLabel] || 0)) >
                    0.5
                      ? "#1F2937"
                      : "#FFFFFF",
                  borderColor: currentTheme.tableBorder,
                }}
              >
                {data[rowLabel]?.[colLabel] || 0}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para o Modal de Seleção/Criação de Dashboard
const DashboardSelectorModal = ({
  currentTheme,
  onSelectDashboard,
  onCreateNewDashboard,
  onClose,
}) => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardPassword, setNewDashboardPassword] = useState("");
  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  const firebaseConfig = JSON.parse(
    typeof __firebase_config !== "undefined" ? __firebase_config : "{}"
  );

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // Sign in anonymously if no user is authenticated
          try {
            if (typeof __initial_auth_token !== "undefined") {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
            setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
          } catch (anonError) {
            console.error("Erro ao autenticar anonimamente:", anonError);
            setError("Falha na autenticação. Tente recarregar a página.");
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Erro ao inicializar Firebase:", err);
      setError("Falha ao inicializar o Firebase. Verifique sua configuração.");
    }
  }, [firebaseConfig]);

  // Fetch dashboards when auth is ready
  useEffect(() => {
    if (db && isAuthReady) {
      const dashboardsColRef = collection(
        db,
        `artifacts/${appId}/public/data/dashboards`
      );
      const unsubscribe = onSnapshot(
        dashboardsColRef,
        (snapshot) => {
          const fetchedDashboards = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDashboards(fetchedDashboards);
          setLoading(false);
        },
        (err) => {
          console.error("Erro ao buscar dashboards:", err);
          setError("Falha ao carregar dashboards.");
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [db, isAuthReady, appId]);

  const handleCreateDashboard = async () => {
    setError("");
    setPasswordError("");
    if (!newDashboardName.trim() || !newDashboardPassword.trim()) {
      setError("Nome e senha do dashboard não podem ser vazios.");
      return;
    }
    if (!db || !userId) {
      setError("Firebase não inicializado ou usuário não autenticado.");
      return;
    }

    // Check if dashboard name already exists
    const q = query(
      collection(db, `artifacts/${appId}/public/data/dashboards`),
      where("name", "==", newDashboardName.trim())
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setError(
        "Já existe um dashboard com este nome. Por favor, escolha outro."
      );
      return;
    }

    try {
      setLoading(true);
      const dashboardRef = doc(
        collection(db, `artifacts/${appId}/public/data/dashboards`)
      );
      await setDoc(dashboardRef, {
        name: newDashboardName.trim(),
        password: newDashboardPassword.trim(), // NOT SECURE FOR PRODUCTION! HASH PASSWORDS!
        activities: [],
        customStatuses: [],
        customRisks: [],
        createdAt: new Date().toISOString(),
        createdBy: userId,
      });
      onSelectDashboard(dashboardRef.id); // Automatically select the new dashboard
      setNewDashboardName("");
      setNewDashboardPassword("");
      onClose();
    } catch (err) {
      console.error("Erro ao criar dashboard:", err);
      setError("Falha ao criar o dashboard. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = (dashboard) => {
    setSelectedDashboardId(dashboard.id);
    setShowPasswordPrompt(true);
  };

  const handlePasswordSubmit = () => {
    setPasswordError("");
    const selectedDash = dashboards.find((d) => d.id === selectedDashboardId);
    if (selectedDash && selectedDash.password === passwordInput) {
      onSelectDashboard(selectedDashboardId);
      onClose();
    } else {
      setPasswordError("Senha incorreta.");
    }
  };

  if (loading || !isAuthReady) {
    return (
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div
          className="rounded-lg shadow-xl p-6 w-full max-w-md"
          style={{
            backgroundColor: currentTheme.cardBackground,
            color: currentTheme.textColor,
          }}
        >
          <p className="text-center">Carregando dashboards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div
          className="rounded-lg shadow-xl p-6 w-full max-w-md"
          style={{
            backgroundColor: currentTheme.cardBackground,
            color: currentTheme.textColor,
          }}
        >
          <p className="text-center text-red-500">{error}</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.primaryColor,
                color: currentTheme.textColor,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: currentTheme.background }}
    >
      <div
        className="rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: currentTheme.cardBackground,
          color: currentTheme.textColor,
        }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.textColor }}
        >
          Selecionar ou Criar Dashboard
        </h2>

        {/* Lista de Dashboards Existentes */}
        <div className="mb-6">
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: currentTheme.textColor }}
          >
            Dashboards Existentes:
          </h3>
          {dashboards.length === 0 ? (
            <p
              className="text-sm italic"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Nenhum dashboard encontrado. Crie um novo!
            </p>
          ) : (
            <ul className="space-y-2">
              {dashboards.map((dashboard) => (
                <li
                  key={dashboard.id}
                  className="flex justify-between items-center p-3 rounded-md border"
                  style={{
                    borderColor: currentTheme.tableBorder,
                    backgroundColor: currentTheme.background,
                  }}
                >
                  <span
                    className="font-medium"
                    style={{ color: currentTheme.textColor }}
                  >
                    {dashboard.name}
                  </span>
                  <button
                    onClick={() => handleOpenDashboard(dashboard)}
                    className="px-3 py-1 rounded-md shadow-sm transition-colors duration-200"
                    style={{
                      backgroundColor: currentTheme.primaryColor,
                      color: currentTheme.textColor,
                    }}
                  >
                    Abrir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prompt de Senha */}
        {showPasswordPrompt && (
          <div
            className="mb-6 p-4 rounded-lg shadow-inner"
            style={{ backgroundColor: currentTheme.background }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: currentTheme.textColor }}
            >
              Digite a senha para "
              {dashboards.find((d) => d.id === selectedDashboardId)?.name}":
            </h3>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              style={{
                backgroundColor: currentTheme.cardBackground,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handlePasswordSubmit();
              }}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordPrompt(false)}
                className="px-4 py-2 rounded-md border border-gray-300 shadow-sm transition-colors duration-200"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  borderColor: currentTheme.tableBorder,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
                style={{
                  backgroundColor: currentTheme.primaryColor,
                  color: currentTheme.textColor,
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* Criar Novo Dashboard */}
        <div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: currentTheme.textColor }}
          >
            Criar Novo Dashboard:
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nome do Novo Dashboard"
              className="p-2 border rounded-md"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha do Novo Dashboard"
              className="p-2 border rounded-md"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={newDashboardPassword}
              onChange={(e) => setNewDashboardPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button
              onClick={handleCreateDashboard}
              className="px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.secondaryColor,
                color: currentTheme.textColor,
              }}
            >
              Criar Dashboard
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 shadow-sm transition-colors duration-200"
            style={{
              backgroundColor: currentTheme.cardBackground,
              color: currentTheme.textColor,
              borderColor: currentTheme.tableBorder,
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal do aplicativo
const App = () => {
  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  const firebaseConfig = JSON.parse(
    typeof __firebase_config !== "undefined" ? __firebase_config : "{}"
  );

  // Dashboard state
  const [activeDashboardId, setActiveDashboardId] = useState(null);
  const [activeDashboardName, setActiveDashboardName] = useState("");
  const [showDashboardSelector, setShowDashboardSelector] = useState(true); // Show selector on initial load

  // Theme state
  const [currentThemeKey, setCurrentThemeKey] = useState("light");
  const currentTheme = themes[currentThemeKey];

  // Activities state (now loaded from/saved to Firestore)
  const [allActivities, setAllActivities] = useState([]);
  const [customStatuses, setCustomStatuses] = useState([]);
  const [customRisks, setCustomRisks] = useState([]);

  // Other UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterResponsavel, setFilterResponsavel] = useState("Todos");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentActivityToEdit, setCurrentActivityToEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Todos");
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);
  const [isReportSectionOpen, setIsReportSectionOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfLibsLoaded, setPdfLibsLoaded] = useState(false);
  const [generatedAnalysis, setGeneratedAnalysis] = useState("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#000000");
  const [newRiskInput, setNewRiskInput] = useState("");
  const [newRiskColor, setNewRiskColor] = useState("#000000");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (typeof __initial_auth_token !== "undefined") {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
            setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
          } catch (anonError) {
            console.error("Erro ao autenticar anonimamente:", anonError);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Erro ao inicializar Firebase:", err);
    }
  }, [firebaseConfig]);

  // Load dashboard data when activeDashboardId changes
  useEffect(() => {
    if (db && activeDashboardId && isAuthReady) {
      const dashboardDocRef = doc(
        db,
        `artifacts/${appId}/public/data/dashboards`,
        activeDashboardId
      );
      const unsubscribe = onSnapshot(
        dashboardDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAllActivities(data.activities || []);
            setCustomStatuses(data.customStatuses || []);
            setCustomRisks(data.customRisks || []);
            setActiveDashboardName(data.name || "Dashboard Sem Nome");
          } else {
            console.log("Dashboard não encontrado!");
            setAllActivities([]);
            setCustomStatuses([]);
            setCustomRisks([]);
            setActiveDashboardId(null); // Reset if dashboard doesn't exist
            setActiveDashboardName("");
            setShowDashboardSelector(true); // Show selector again if dashboard not found
          }
        },
        (err) => {
          console.error("Erro ao carregar dados do dashboard:", err);
        }
      );
      return () => unsubscribe();
    }
  }, [db, activeDashboardId, isAuthReady, appId]);

  // Save activities to Firestore whenever they change
  useEffect(() => {
    if (db && activeDashboardId && isAuthReady) {
      const dashboardDocRef = doc(
        db,
        `artifacts/${appId}/public/data/dashboards`,
        activeDashboardId
      );
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(async () => {
        try {
          await setDoc(
            dashboardDocRef,
            { activities: allActivities, customStatuses, customRisks },
            { merge: true }
          );
        } catch (e) {
          console.error("Erro ao salvar atividades no Firestore:", e);
        }
      }, 500); // Save after 500ms of no changes
      return () => clearTimeout(timeoutId);
    }
  }, [
    allActivities,
    customStatuses,
    customRisks,
    db,
    activeDashboardId,
    isAuthReady,
    appId,
  ]);

  // Effect to adjust dates based on selected period
  useEffect(() => {
    const today = new Date();
    let newStartDate = "";
    let newEndDate = "";

    const getFormattedDate = (date) => date.toISOString().split("T")[0];

    switch (selectedPeriod) {
      case "Semana":
        const firstDayOfWeek = new Date(
          today.setDate(today.getDate() - today.getDay())
        );
        newStartDate = getFormattedDate(firstDayOfWeek);
        newEndDate = getFormattedDate(
          new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 6))
        );
        break;
      case "Mês":
        newStartDate = getFormattedDate(
          new Date(today.getFullYear(), today.getMonth(), 1)
        );
        newEndDate = getFormattedDate(
          new Date(today.getFullYear(), today.getMonth() + 1, 0)
        );
        break;
      case "Trimestre":
        const currentMonth = today.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        newStartDate = getFormattedDate(
          new Date(today.getFullYear(), currentQuarter * 3, 1)
        );
        newEndDate = getFormattedDate(
          new Date(today.getFullYear(), currentQuarter * 3 + 3, 0)
        );
        break;
      case "Semestre":
        const currentSemester = today.getMonth() < 6 ? 0 : 6;
        newStartDate = getFormattedDate(
          new Date(today.getFullYear(), currentSemester, 1)
        );
        newEndDate = getFormattedDate(
          new Date(today.getFullYear(), currentSemester + 6, 0)
        );
        break;
      case "Ano":
        newStartDate = getFormattedDate(new Date(today.getFullYear(), 0, 1));
        newEndDate = getFormattedDate(new Date(today.getFullYear(), 11, 31));
        break;
      case "Todos":
      default:
        newStartDate = "";
        newEndDate = "";
        break;
    }
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [selectedPeriod]);

  // Effect to dynamically load html2canvas and jspdf libraries
  useEffect(() => {
    const loadScript = (src, id, onloadCallback) => {
      if (document.getElementById(id)) {
        onloadCallback();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.id = id;
      script.onload = onloadCallback;
      script.onerror = () =>
        console.error(`Falha ao carregar o script: ${src}`);
      document.body.appendChild(script);
    };

    let html2canvasLoaded = false;
    let jspdfLoaded = false;

    const checkAllLoaded = () => {
      if (html2canvasLoaded && jspdfLoaded) {
        setPdfLibsLoaded(true);
      }
    };

    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "html2canvas-script",
      () => {
        html2canvasLoaded = true;
        checkAllLoaded();
      }
    );

    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "jspdf-script",
      () => {
        jspdfLoaded = true;
        checkAllLoaded();
      }
    );

    return () => {
      const html2canvasScript = document.getElementById("html2canvas-script");
      const jspdfScript = document.getElementById("jspdf-script");
      if (html2canvasScript) document.body.removeChild(html2canvasScript);
      if (jspdfScript) document.body.removeChild(jspdfScript);
    };
  }, []);

  // Function to show temporary feedback
  const showFeedback = (message) => {
    setFeedbackMessage(message);
    const timer = setTimeout(() => {
      setFeedbackMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  };

  // Function to add a new status
  const handleAddStatus = () => {
    const trimmedInput = newStatusInput.trim();
    const defaultStatuses = [
      "Concluído",
      "Em Andamento",
      "Atrasado",
      "Não Iniciado",
    ];
    const allExistingStatusNames = [
      ...new Set([...defaultStatuses, ...customStatuses.map((s) => s.name)]),
    ];

    if (trimmedInput === "") {
      showFeedback("O nome do status não pode ser vazio!");
      return;
    }

    if (allExistingStatusNames.includes(trimmedInput)) {
      showFeedback("Status já existe!");
      return;
    }

    setCustomStatuses((prev) => [
      ...prev,
      { name: trimmedInput, color: newStatusColor },
    ]);
    setNewStatusInput("");
    setNewStatusColor("#000000");
    showFeedback(`Status "${trimmedInput}" adicionado!`);
  };

  // Function to add a new risk
  const handleAddRisk = () => {
    const trimmedInput = newRiskInput.trim();
    const defaultRisks = ["Alto", "Média", "Baixo"];
    const allExistingRiskNames = [
      ...new Set([...defaultRisks, ...customRisks.map((r) => r.name)]),
    ];

    if (trimmedInput === "") {
      showFeedback("O nome do risco não pode ser vazio!");
      return;
    }

    if (allExistingRiskNames.includes(trimmedInput)) {
      showFeedback("Risco já existe!");
      return;
    }

    setCustomRisks((prev) => [
      ...prev,
      { name: trimmedInput, color: newRiskColor },
    ]);
    setNewRiskInput("");
    setNewRiskColor("#000000");
    showFeedback(`Risco "${trimmedInput}" adicionado!`);
  };

  // Function to get background color for a status
  const getStatusBgColor = (statusName) => {
    const defaultColors = {
      Concluído: "#D1FAE5",
      "Em Andamento": "#DBEAFE",
      Atrasado: "#FEE2E2",
      "Não Iniciado": "#F3F4F6",
    };
    const custom = customStatuses.find((s) => s.name === statusName);
    return custom
      ? custom.color
      : defaultColors[statusName] || currentTheme.tableHeaderBg;
  };

  // Function to get text color for a status
  const getStatusTextColor = (statusName) => {
    const defaultTextColors = {
      Concluído: "#065F46",
      "Em Andamento": "#1E40AF",
      Atrasado: "#991B1B",
      "Não Iniciado": "#374151",
    };
    const custom = customStatuses.find((s) => s.name === statusName);
    if (custom) {
      return getLuminance(custom.color) > 0.5 ? "#1F2937" : "#FFFFFF";
    }
    return defaultTextColors[statusName] || currentTheme.textColor;
  };

  // Function to get background color for a risk
  const getRiskBgColor = (riskName) => {
    const defaultColors = {
      Alto: "#FEE2E2",
      Média: "#FEF3C7",
      Baixo: "#D1FAE5",
    };
    const custom = customRisks.find((r) => r.name === riskName);
    return custom
      ? custom.color
      : defaultColors[riskName] || currentTheme.tableHeaderBg;
  };

  // Function to get text color for a risk
  const getRiskTextColor = (riskName) => {
    const defaultTextColors = {
      Alto: "#991B1B",
      Média: "#92400E",
      Baixo: "#065F46",
    };
    const custom = customRisks.find((r) => r.name === riskName);
    if (custom) {
      return getLuminance(custom.color) > 0.5 ? "#1F2937" : "#FFFFFF";
    }
    return defaultTextColors[riskName] || currentTheme.textColor;
  };

  // Column definitions for the table
  const columnDefinitions = [
    { key: "atividade", label: "Atividade", defaultVisible: true },
    { key: "disciplina", label: "Disciplina", defaultVisible: true },
    { key: "responsavel", label: "Resp.", defaultVisible: true },
    { key: "prioridade", label: "Prioridade", defaultVisible: true },
    {
      key: "dataInicialPlanejada",
      label: "Data Inic. Plan.",
      defaultVisible: true,
    },
    {
      key: "dataFinalPlanejada",
      label: "Data Fin. Plan.",
      defaultVisible: true,
    },
    { key: "dataInicialReal", label: "Data Inic. Real", defaultVisible: true },
    { key: "dataFinalReal", label: "Data Fin. Real", defaultVisible: true },
    { key: "valorPlanejado", label: "Valor Plan. (R$)", defaultVisible: true },
    { key: "valorReal", label: "Valor Real (R$)", defaultVisible: true },
    { key: "custoReal", label: "Custo Real (R$)", defaultVisible: true },
    { key: "statusPlanejado", label: "Status Plan.", defaultVisible: true },
    { key: "statusReal", label: "Status Real", defaultVisible: true },
    {
      key: "percentualConclusao",
      label: "Conclusão (%)",
      defaultVisible: true,
    },
    { key: "riscoAssociado", label: "Risco", defaultVisible: true },
    { key: "diasAtraso", label: "Dias Atraso", defaultVisible: true },
    {
      key: "diasRemanescentes",
      label: "Dias Remanescentes",
      defaultVisible: true,
    },
    {
      key: "recursosNecessarios",
      label: "Recursos Necessários",
      defaultVisible: true,
    },
    { key: "linkDocumento", label: "Link/Documento", defaultVisible: true },
    {
      key: "dataUltimaAtualizacao",
      label: "Última Atualização",
      defaultVisible: true,
    },
    { key: "actions", label: "Ações", defaultVisible: true },
  ];

  // State to control column visibility
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initialVisibility = {};
    columnDefinitions.forEach((col) => {
      initialVisibility[col.key] = col.defaultVisible;
    });
    return initialVisibility;
  });

  // Toggle column visibility
  const handleToggleColumnVisibility = (key) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate dashboard summaries
  const getStatusSummary = (type, activitiesToSummarize) => {
    const summary = {
      Concluído: 0,
      "Em Andamento": 0,
      Atrasado: 0,
      "Não Iniciado": 0,
    };
    customStatuses.forEach((status) => {
      summary[status.name] = 0;
    });

    activitiesToSummarize.forEach((activity) => {
      const status =
        type === "planejado" ? activity.statusPlanejado : activity.statusReal;
      if (summary[status] !== undefined) {
        summary[status]++;
      }
    });
    return summary;
  };

  // Filter activities based on search terms and date filters
  const filteredActivities = allActivities.filter((activity) => {
    const activityDate =
      activity.dataInicialReal || activity.dataInicialPlanejada;

    const matchesSearch =
      searchTerm === "" ||
      Object.values(activity).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      filterStatus === "Todos" || activity.statusReal === filterStatus;
    const matchesResponsavel =
      filterResponsavel === "Todos" ||
      activity.responsavel === filterResponsavel;

    let matchesDate = true;
    if (startDate && endDate) {
      if (activityDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentActivityDate = new Date(activityDate);
        matchesDate =
          currentActivityDate >= start && currentActivityDate <= end;
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesResponsavel && matchesDate;
  });

  // Calculate overdue and remaining days for each filtered activity
  const activitiesWithCalculatedMetrics = filteredActivities.map((activity) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plannedEndDate = activity.dataFinalPlanejada
      ? new Date(activity.dataFinalPlanejada)
      : null;
    const realEndDate = activity.dataFinalReal
      ? new Date(activity.dataFinalReal)
      : null;

    let diasAtraso = 0;
    let diasRemanescentes = 0;

    if (activity.statusReal === "Atrasado" && plannedEndDate) {
      diasAtraso = Math.max(
        0,
        Math.ceil(
          (today.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    } else if (
      activity.statusReal === "Concluído" &&
      plannedEndDate &&
      realEndDate &&
      realEndDate > plannedEndDate
    ) {
      diasAtraso = Math.ceil(
        (realEndDate.getTime() - plannedEndDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    } else if (
      (activity.statusReal === "Em Andamento" ||
        activity.statusReal === "Não Iniciado") &&
      plannedEndDate &&
      today > plannedEndDate
    ) {
      diasAtraso = Math.ceil(
        (today.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    if (
      activity.statusReal !== "Concluído" &&
      plannedEndDate &&
      plannedEndDate > today
    ) {
      diasRemanescentes = Math.ceil(
        (plannedEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      ...activity,
      diasAtraso,
      diasRemanescentes,
    };
  });

  const plannedSummary = getStatusSummary(
    "planejado",
    activitiesWithCalculatedMetrics
  );
  const realSummary = getStatusSummary("real", activitiesWithCalculatedMetrics);

  const totalActivities = activitiesWithCalculatedMetrics.length;
  const completedActivities = activitiesWithCalculatedMetrics.filter(
    (act) => act.statusReal === "Concluído"
  ).length;
  const overallCompletionPercentage =
    totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  // Get unique responsible persons for the filter
  const uniqueResponsaveis = [
    ...new Set(allActivities.map((act) => act.responsavel)),
  ];

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (e) {
      return dateString;
    }
  };

  // Format currency function
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Open edit modal
  const handleEditClick = (activity) => {
    setCurrentActivityToEdit(activity);
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentActivityToEdit(null);
  };

  // Save activity changes (updates Firestore via useEffect)
  const handleSaveActivity = (updatedActivity) => {
    setAllActivities((prevActivities) =>
      prevActivities.map((act) =>
        act.id === updatedActivity.id ? updatedActivity : act
      )
    );
  };

  // Open add activity modal
  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  // Close add activity modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Add new activity (updates Firestore via useEffect)
  const handleAddNewActivity = (newActivity) => {
    setAllActivities((prevActivities) => [...prevActivities, newActivity]);
  };

  // Export report as PDF
  const handleExportPdf = async () => {
    if (!pdfLibsLoaded) {
      showFeedback(
        "As bibliotecas de PDF ainda estão carregando. Por favor, aguarde e tente novamente."
      );
      return;
    }

    setIsGeneratingPdf(true);
    const reportElement = document.getElementById("report-content");

    if (reportElement) {
      try {
        const canvas = await window.html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          windowWidth: reportElement.scrollWidth,
          windowHeight: reportElement.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new window.jspdf.jsPDF("p", "mm", "a4");

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const date = new Date();
        const filename = `Relatorio_Atividades_${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}.pdf`;
        pdf.save(filename);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        showFeedback("Erro ao gerar PDF. Tente novamente.");
      } finally {
        setIsGeneratingPdf(false);
      }
    } else {
      showFeedback("Conteúdo do relatório não encontrado para exportação.");
      setIsGeneratingPdf(false);
    }
  };

  // Data preparation for charts
  const statusChartData = Object.keys(plannedSummary).map((status) => ({
    status: status,
    Planejado: plannedSummary[status],
    Real: realSummary[status],
  }));

  const deadlineDeviationData = activitiesWithCalculatedMetrics
    .map((activity) => {
      const plannedEndDate = activity.dataFinalPlanejada
        ? new Date(activity.dataFinalPlanejada)
        : null;
      const realEndDate = activity.dataFinalReal
        ? new Date(activity.dataFinalReal)
        : null;
      let deviation = 0;

      if (plannedEndDate && realEndDate) {
        deviation =
          (realEndDate.getTime() - plannedEndDate.getTime()) /
          (1000 * 60 * 60 * 24);
      } else if (plannedEndDate && !realEndDate) {
        deviation =
          (new Date().getTime() - plannedEndDate.getTime()) /
          (1000 * 60 * 60 * 24);
      }
      return {
        atividade: activity.atividade,
        desvioDias: parseFloat(deviation.toFixed(1)),
      };
    })
    .sort((a, b) => b.desvioDias - a.desvioDias);

  const costByDiscipline = activitiesWithCalculatedMetrics.reduce(
    (acc, activity) => {
      if (!acc[activity.disciplina]) {
        acc[activity.disciplina] = {
          disciplina: activity.disciplina,
          Planejado: 0,
          Real: 0,
        };
      }
      acc[activity.disciplina].Planejado += activity.valorPlanejado || 0;
      acc[activity.disciplina].Real += activity.valorReal || 0;
      return acc;
    },
    {}
  );
  const costChartData = Object.values(costByDiscipline);

  const completionByDiscipline = activitiesWithCalculatedMetrics.reduce(
    (acc, activity) => {
      if (!acc[activity.disciplina]) {
        acc[activity.disciplina] = { total: 0, completed: 0 };
      }
      acc[activity.disciplina].total++;
      if (activity.statusReal === "Concluído") {
        acc[activity.disciplina].completed++;
      }
      return acc;
    },
    {}
  );

  const completionPieData = Object.keys(completionByDiscipline).map(
    (discipline) => {
      const total = completionByDiscipline[discipline].total;
      const completed = completionByDiscipline[discipline].completed;
      return {
        name: discipline,
        value: total > 0 ? (completed / total) * 100 : 0,
      };
    }
  );

  const priorityData = activitiesWithCalculatedMetrics.reduce(
    (acc, activity) => {
      acc[activity.prioridade] = (acc[activity.prioridade] || 0) + 1;
      return acc;
    },
    {}
  );
  const priorityChartData = Object.keys(priorityData).map((priority) => ({
    name: priority,
    count: priorityData[priority],
  }));

  const riskData = activitiesWithCalculatedMetrics.reduce((acc, activity) => {
    acc[activity.riscoAssociado] = (acc[activity.riscoAssociado] || 0) + 1;
    return acc;
  }, {});
  const riskChartData = Object.keys(riskData).map((risk) => ({
    name: risk,
    count: riskData[risk],
  }));

  const PIE_COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A28DFF",
    "#FF6384",
  ];

  const heatmapData = {};
  const allDisciplinesForHeatmap = [
    ...new Set(activitiesWithCalculatedMetrics.map((act) => act.disciplina)),
  ];
  const allResponsaveisForHeatmap = [
    ...new Set(activitiesWithCalculatedMetrics.map((act) => act.responsavel)),
  ];

  allDisciplinesForHeatmap.forEach((discipline) => {
    heatmapData[discipline] = {};
    allResponsaveisForHeatmap.forEach((responsible) => {
      heatmapData[discipline][responsible] = 0;
    });
  });

  activitiesWithCalculatedMetrics.forEach((activity) => {
    if (
      heatmapData[activity.disciplina] &&
      heatmapData[activity.disciplina][activity.responsavel] !== undefined
    ) {
      heatmapData[activity.disciplina][activity.responsavel]++;
    }
  });

  let maxActivityCount = 0;
  Object.values(heatmapData).forEach((disciplineCounts) => {
    Object.values(disciplineCounts).forEach((count) => {
      if (count > maxActivityCount) {
        maxActivityCount = count;
      }
    });
  });

  const overdueActivities = activitiesWithCalculatedMetrics
    .filter((activity) => activity.statusReal === "Atrasado")
    .sort((a, b) => {
      const dateA = new Date(a.dataFinalPlanejada);
      const dateB = new Date(b.dataFinalPlanejada);
      return dateA - dateB;
    });

  const remainingDaysActivities = activitiesWithCalculatedMetrics
    .filter(
      (activity) =>
        activity.diasRemanescentes > 0 && activity.statusReal !== "Concluído"
    )
    .sort((a, b) => a.diasRemanescentes - b.diasRemanescentes);

  const activitiesByResponsibleSummary = activitiesWithCalculatedMetrics.reduce(
    (acc, activity) => {
      if (!acc[activity.responsavel]) {
        acc[activity.responsavel] = {
          total: 0,
          concluido: 0,
          emAndamento: 0,
          atrasado: 0,
          naoIniciado: 0,
        };
      }
      acc[activity.responsavel].total++;
      switch (activity.statusReal) {
        case "Concluído":
          acc[activity.responsavel].concluido++;
          break;
        case "Em Andamento":
          acc[activity.responsavel].emAndamento++;
          break;
        case "Atrasado":
          acc[activity.responsavel].atrasado++;
          break;
        case "Não Iniciado":
          acc[activity.responsavel].naoIniciado++;
          break;
        default:
          acc[activity.responsavel].emAndamento++;
          break;
      }
      return acc;
    },
    {}
  );

  const totalPlannedCost = activitiesWithCalculatedMetrics.reduce(
    (sum, act) => sum + act.valorPlanejado,
    0
  );
  const totalRealCost = activitiesWithCalculatedMetrics.reduce(
    (sum, act) => sum + act.valorReal,
    0
  );
  const costDeviation = totalRealCost - totalPlannedCost;

  const totalDiasAtraso = activitiesWithCalculatedMetrics.reduce(
    (sum, act) => sum + act.diasAtraso,
    0
  );
  const totalDiasRemanescentes = activitiesWithCalculatedMetrics.reduce(
    (sum, act) => sum + act.diasRemanescentes,
    0
  );

  // Gemini API call for analysis
  useEffect(() => {
    const fetchObservationAnalysis = async () => {
      if (!isReportSectionOpen) {
        setGeneratedAnalysis("");
        return;
      }

      setIsGeneratingAnalysis(true);
      try {
        const prompt = `Gere uma análise concisa e profissional do desempenho das atividades com base nos seguintes dados:
          - Total de atividades monitoradas: ${totalActivities}
          - Percentual de conclusão geral: ${overallCompletionPercentage.toFixed(
            1
          )}% (${completedActivities} de ${totalActivities} concluídas)
          - Total de dias de atraso acumulados: ${totalDiasAtraso} (${
          overdueActivities.length
        } atividades atrasadas)
          - Total de dias remanescentes em atividades não concluídas: ${totalDiasRemanescentes}
          - Custo total planejado: ${formatCurrency(totalPlannedCost)}
          - Custo total real: ${formatCurrency(totalRealCost)}
          - Desvio de custo: ${formatCurrency(
            costDeviation
          )} (positivo significa que o real superou o planejado, negativo significa que o real foi menor)
          - Atividades de alta prioridade: ${priorityData["Alta"] || 0}
          - Atividades com risco alto: ${riskData["Alto"] || 0}

          A análise deve oferecer insights sobre o progresso geral, pontualidade e gestão de custos. Destaque pontos fortes e áreas que necessitam de atenção.
          Escreva em português do Brasil.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Erro da API Gemini: Status ${response.status}, Mensagem: ${errorText}`
          );
          setGeneratedAnalysis(
            `Erro ao gerar a análise: ${response.status} - ${
              errorText || "Resposta vazia ou inválida."
            }`
          );
          return;
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da API Gemini:", jsonError);
          const rawResponseText = await response.text();
          setGeneratedAnalysis(
            `Erro ao processar a resposta da API: O formato da resposta não é válido. Resposta bruta: ${rawResponseText.substring(
              0,
              200
            )}...`
          );
          return;
        }

        if (
          result.candidates &&
          result.candidates.length > 0 &&
          result.candidates[0].content &&
          result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0
        ) {
          const text = result.candidates[0].content.parts[0].text;
          setGeneratedAnalysis(text);
        } else {
          setGeneratedAnalysis(
            "Não foi possível gerar a análise. Tente novamente."
          );
          console.error("Erro na estrutura da resposta do Gemini:", result);
        }
      } catch (error) {
        console.error("Erro ao chamar a API do Gemini:", error);
        setGeneratedAnalysis(
          "Erro ao gerar a análise. Verifique sua conexão ou tente novamente."
        );
      } finally {
        setIsGeneratingAnalysis(false);
      }
    };

    fetchObservationAnalysis();
  }, [
    isReportSectionOpen,
    totalActivities,
    overallCompletionPercentage,
    totalDiasAtraso,
    overdueActivities.length,
    totalDiasRemanescentes,
    totalPlannedCost,
    totalRealCost,
    costDeviation,
    priorityData,
    riskData,
  ]);

  const handleSelectDashboard = useCallback((id) => {
    setActiveDashboardId(id);
    setShowDashboardSelector(false);
  }, []);

  const handleCreateNewDashboard = useCallback(() => {
    // This function is now handled within DashboardSelectorModal
  }, []);

  if (!isAuthReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: currentTheme.background,
          color: currentTheme.textColor,
        }}
      >
        <p>Inicializando Firebase e autenticando...</p>
      </div>
    );
  }

  if (showDashboardSelector) {
    return (
      <DashboardSelectorModal
        currentTheme={currentTheme}
        onSelectDashboard={handleSelectDashboard}
        onCreateNewDashboard={handleCreateNewDashboard}
        onClose={() => {
          // If no dashboard is selected and user closes, what should happen?
          // For now, let's keep the selector open until a dashboard is chosen.
          // Or, provide a way to close and show a "No Dashboard Selected" state.
          // For this example, we'll assume a dashboard must be selected to proceed.
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen p-4 font-inter"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.textColor,
      }}
    >
      <header
        className="shadow rounded-lg p-6 mb-6 no-print"
        style={{ backgroundColor: currentTheme.cardBackground }}
      >
        <div className="flex justify-between items-center">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: currentTheme.textColor }}
          >
            Dashboard de Atividades: {activeDashboardName}
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDashboardSelector(true)}
              className="px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.primaryColor,
                color: currentTheme.textColor,
              }}
            >
              Mudar Dashboard
            </button>
            <label
              htmlFor="theme-select"
              className="text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Tema:
            </label>
            <select
              id="theme-select"
              className="p-2 border rounded-md"
              style={{
                backgroundColor: currentTheme.cardBackground,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={currentThemeKey}
              onChange={(e) => setCurrentThemeKey(e.target.value)}
            >
              {Object.keys(themes).map((key) => (
                <option key={key} value={key}>
                  {themes[key].name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="" style={{ color: currentTheme.secondaryTextColor }}>
          Acompanhe o progresso das suas atividades e compare o desempenho real
          com o planejado.
        </p>
        <p
          className="text-sm mt-2"
          style={{ color: currentTheme.secondaryTextColor }}
        >
          ID do Usuário: {userId}
        </p>
      </header>

      {/* Seção de Visão Geral */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 no-print">
        {/* Card de Resumo de Status Planejado */}
        <div
          className="p-6 rounded-lg shadow-md border-l-4"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.primaryColor,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Status Planejado
          </h2>
          {Object.entries(plannedSummary).map(([status, count]) => (
            <p key={status} style={{ color: currentTheme.secondaryTextColor }}>
              <span className="font-medium">{status}:</span> {count} atividades
            </p>
          ))}
        </div>

        {/* Card de Resumo de Status Real */}
        <div
          className="p-6 rounded-lg shadow-md border-l-4"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.secondaryColor,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Status Real
          </h2>
          {Object.entries(realSummary).map(([status, count]) => (
            <p key={status} style={{ color: currentTheme.secondaryTextColor }}>
              <span className="font-medium">{status}:</span> {count} atividades
            </p>
          ))}
        </div>

        {/* Card de Percentual de Conclusão Geral */}
        <div
          className="p-6 rounded-lg shadow-md border-l-4 col-span-1 md:col-span-2 lg:col-span-1"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.accentColor,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Conclusão Geral
          </h2>
          <div className="flex items-center">
            <div
              className="w-full rounded-full h-4"
              style={{ backgroundColor: currentTheme.tableBorder }}
            >
              <div
                className="h-4 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${overallCompletionPercentage}%`,
                  backgroundColor: currentTheme.accentColor,
                }}
              ></div>
            </div>
            <span
              className="ml-4 text-lg font-bold"
              style={{ color: currentTheme.accentColor }}
            >
              {overallCompletionPercentage.toFixed(1)}%
            </span>
          </div>
          <p
            className="mt-2"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            {completedActivities} de {totalActivities} atividades concluídas.
          </p>
        </div>

        {/* Card de Desvio de Custos (Exemplo de métrica) */}
        <div
          className="p-6 rounded-lg shadow-md border-l-4"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.dangerColor,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Desvio de Custos
          </h2>
          <p style={{ color: currentTheme.secondaryTextColor }}>
            <span className="font-medium">Total Planejado:</span>{" "}
            {formatCurrency(totalPlannedCost)}
          </p>
          <p style={{ color: currentTheme.secondaryTextColor }}>
            <span className="font-medium">Total Real:</span>{" "}
            {formatCurrency(totalRealCost)}
          </p>
          <p
            className="font-bold mt-2"
            style={{ color: currentTheme.textColor }}
          >
            Desvio: {formatCurrency(costDeviation)}
          </p>
        </div>

        {/* Novo Card: Total de Dias de Atraso */}
        <div
          className="p-6 rounded-lg shadow-md border-l-4"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.warningColor,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Total de Dias de Atraso
          </h2>
          <p
            className="text-2xl font-bold"
            style={{ color: currentTheme.warningColor }}
          >
            {totalDiasAtraso} dias
          </p>
          <p
            className="mt-2"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            Soma dos dias de atraso de todas as atividades.
          </p>
        </div>

        {/* Novo Card: Total de Dias Remanescentes */}
        <div
          className="p-6 rounded-lg shadow-md border-l-4"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.chartSecondary,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Total de Dias Remanescentes
          </h2>
          <p
            className="text-2xl font-bold"
            style={{ color: currentTheme.chartSecondary }}
          >
            {totalDiasRemanescentes} dias
          </p>
          <p
            className="mt-2"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            Soma dos dias restantes para atividades não concluídas.
          </p>
        </div>
      </section>

      {/* Seção de Filtros de Data */}
      <section
        className="p-6 rounded-lg shadow-md mb-8 no-print"
        style={{ backgroundColor: currentTheme.cardBackground }}
      >
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: currentTheme.textColor }}
        >
          Filtrar por Período
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col">
            <label
              htmlFor="period-select"
              className="text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Período Rápido:
            </label>
            <select
              id="period-select"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="Todos">Todos os Períodos</option>
              <option value="Semana">Esta Semana</option>
              <option value="Mês">Este Mês</option>
              <option value="Trimestre">Este Trimestre</option>
              <option value="Semestre">Este Semestre</option>
              <option value="Ano">Este Ano</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="start-date"
              className="text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Inicial:
            </label>
            <input
              type="date"
              id="start-date"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedPeriod("Customizado"); // Marca como customizado se a data for alterada manualmente
              }}
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="end-date"
              className="text-sm font-medium"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Data Final:
            </label>
            <input
              type="date"
              id="end-date"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedPeriod("Customizado"); // Marca como customizado se a data for alterada manualmente
              }}
            />
          </div>
        </div>
      </section>

      {/* Seção de Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 no-print">
        {/* Gráfico de Comparativo de Status */}
        <div
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Comparativo de Status (Planejado vs. Real)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={statusChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.tableBorder}
              />
              <XAxis
                dataKey="status"
                stroke={currentTheme.secondaryTextColor}
              />
              <YAxis stroke={currentTheme.secondaryTextColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  border: `1px solid ${currentTheme.tableBorder}`,
                }}
              />
              <Legend wrapperStyle={{ color: currentTheme.textColor }} />
              <Bar
                dataKey="Planejado"
                fill={currentTheme.chartPrimary}
                name="Planejado"
                radius={[10, 10, 0, 0]}
              />
              <Bar
                dataKey="Real"
                fill={currentTheme.chartSecondary}
                name="Real"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Desvio de Prazos */}
        <div
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Desvio de Prazos (Dias)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={deadlineDeviationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.tableBorder}
              />
              <XAxis dataKey="atividade" hide={true} />{" "}
              {/* Oculta os rótulos do eixo X se houver muitas atividades */}
              <YAxis stroke={currentTheme.secondaryTextColor} />
              <Tooltip
                formatter={(value) => `${value} dias`}
                contentStyle={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  border: `1px solid ${currentTheme.tableBorder}`,
                }}
              />
              <Legend wrapperStyle={{ color: currentTheme.textColor }} />
              <Bar
                dataKey="desvioDias"
                fill={currentTheme.chartAccent}
                name="Desvio em Dias"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p
            className="text-sm mt-2 text-center"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            (Valores positivos indicam atraso, negativos indicam adiantamento)
          </p>
        </div>

        {/* Gráfico de Comparativo de Custos por Disciplina */}
        <div
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Comparativo de Custos por Disciplina
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={costChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.tableBorder}
              />
              <XAxis
                dataKey="disciplina"
                stroke={currentTheme.secondaryTextColor}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke={currentTheme.secondaryTextColor}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  border: `1px solid ${currentTheme.tableBorder}`,
                }}
              />
              <Legend wrapperStyle={{ color: currentTheme.textColor }} />
              <Bar
                dataKey="Planejado"
                fill={currentTheme.chartPrimary}
                name="Planejado"
                radius={[10, 10, 0, 0]}
              />
              <Bar
                dataKey="Real"
                fill={currentTheme.chartSecondary}
                name="Real"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Percentual de Conclusão por Disciplina */}
        <div
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Conclusão por Disciplina (%)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill={currentTheme.chartPrimary}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {completionPieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value.toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  border: `1px solid ${currentTheme.tableBorder}`,
                }}
              />
              <Legend wrapperStyle={{ color: currentTheme.textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Atividades por Prioridade */}
        <div
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Atividades por Prioridade
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={priorityChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.tableBorder}
              />
              <XAxis dataKey="name" stroke={currentTheme.secondaryTextColor} />
              <YAxis stroke={currentTheme.secondaryTextColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  border: `1px solid ${currentTheme.tableBorder}`,
                }}
              />
              <Legend wrapperStyle={{ color: currentTheme.textColor }} />
              <Bar
                dataKey="count"
                fill={currentTheme.chartPriority}
                name="Número de Atividades"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Atividades por Risco */}
        <div
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Atividades por Risco
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={riskChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={currentTheme.tableBorder}
              />
              <XAxis dataKey="name" stroke={currentTheme.secondaryTextColor} />
              <YAxis stroke={currentTheme.secondaryTextColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  border: `1px solid ${currentTheme.tableBorder}`,
                }}
              />
              <Legend wrapperStyle={{ color: currentTheme.textColor }} />
              <Bar
                dataKey="count"
                fill={currentTheme.chartRisk}
                name="Número de Atividades"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap de Atividades por Responsável e Disciplina */}
        <div
          className="p-6 rounded-lg shadow-md lg:col-span-2"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          {" "}
          {/* Ocupa duas colunas em telas grandes */}
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Heatmap: Atividades por Responsável e Disciplina
          </h2>
          <Heatmap
            data={heatmapData}
            rowLabels={allDisciplinesForHeatmap}
            colLabels={allResponsaveisForHeatmap}
            maxCount={maxActivityCount}
            currentTheme={currentTheme}
          />
          <p
            className="text-sm mt-2 text-center"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            (A intensidade da cor indica o número de atividades)
          </p>
        </div>
      </section>

      {/* Seção da Tabela de Atividades */}
      <section
        className="p-6 rounded-lg shadow-md no-print"
        style={{ backgroundColor: currentTheme.cardBackground }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-2xl font-bold"
            style={{ color: currentTheme.textColor }}
          >
            Detalhes das Atividades
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTableSettingsOpen(!isTableSettingsOpen)}
              className="p-2 rounded-full shadow-md transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
              title="Personalizar Colunas da Tabela"
            >
              {/* Ícone de Engrenagem (SVG inline para evitar dependências externas) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsReportSectionOpen(!isReportSectionOpen)}
              className="px-4 py-2 rounded-md shadow-md transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.accentColor,
                color: currentTheme.textColor,
              }}
            >
              Gerar Relatório
            </button>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 rounded-md shadow-md transition-colors duration-200"
              style={{
                backgroundColor: currentTheme.primaryColor,
                color: currentTheme.textColor,
              }}
            >
              + Adicionar Atividade
            </button>
          </div>
        </div>

        {/* Controles de Visibilidade de Colunas e Gerenciamento de Status/Riscos (agora condicionalmente visíveis) */}
        {isTableSettingsOpen && (
          <div
            className="mb-6 p-4 rounded-lg shadow-inner transition-all duration-300 ease-in-out"
            style={{ backgroundColor: currentTheme.background }}
          >
            {/* Mensagem de Feedback */}
            {feedbackMessage && (
              <div
                className="border-l-4 p-3 mb-4 rounded-md"
                style={{
                  backgroundColor: currentTheme.warningColor + "33",
                  borderColor: currentTheme.warningColor,
                  color: currentTheme.warningColor,
                }}
              >
                <p className="font-medium">{feedbackMessage}</p>
              </div>
            )}

            {/* Mostrar/Ocultar Colunas */}
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: currentTheme.textColor }}
            >
              Mostrar/Ocultar Colunas:
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
              {columnDefinitions
                .filter((col) => col.key !== "actions")
                .map(
                  (
                    col // Exclui 'Ações' para não ser ocultável
                  ) => (
                    <label
                      key={col.key}
                      className="inline-flex items-center text-sm"
                      style={{ color: currentTheme.secondaryTextColor }}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded"
                        style={{ color: currentTheme.primaryColor }}
                        checked={visibleColumns[col.key]}
                        onChange={() => handleToggleColumnVisibility(col.key)}
                      />
                      <span className="ml-2">{col.label}</span>
                    </label>
                  )
                )}
            </div>

            {/* Gerenciar Status */}
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: currentTheme.textColor }}
            >
              Gerenciar Status:
            </h3>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <input
                type="text"
                placeholder="Novo Status"
                className="p-2 border rounded-md flex-grow max-w-xs"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  borderColor: currentTheme.tableBorder,
                }}
                value={newStatusInput}
                onChange={(e) => setNewStatusInput(e.target.value)}
              />
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-10 h-10 p-1 border rounded-md cursor-pointer"
                style={{ borderColor: currentTheme.tableBorder }}
                title="Escolher cor para o status"
              />
              <button
                onClick={handleAddStatus}
                className="px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
                style={{
                  backgroundColor: currentTheme.secondaryColor,
                  color: currentTheme.textColor,
                }}
              >
                Adicionar Status
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {customStatuses.map((status, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    backgroundColor: status.color,
                    color: getStatusTextColor(status.name),
                  }}
                >
                  {status.name}
                </span>
              ))}
            </div>

            {/* Gerenciar Riscos */}
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: currentTheme.textColor }}
            >
              Gerenciar Riscos:
            </h3>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <input
                type="text"
                placeholder="Novo Risco"
                className="p-2 border rounded-md flex-grow max-w-xs"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  color: currentTheme.textColor,
                  borderColor: currentTheme.tableBorder,
                }}
                value={newRiskInput}
                onChange={(e) => setNewRiskInput(e.target.value)}
              />
              <input
                type="color"
                value={newRiskColor}
                onChange={(e) => setNewRiskColor(e.target.value)}
                className="w-10 h-10 p-1 border rounded-md cursor-pointer"
                style={{ borderColor: currentTheme.tableBorder }}
                title="Escolher cor para o risco"
              />
              <button
                onClick={handleAddRisk}
                className="px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
                style={{
                  backgroundColor: currentTheme.dangerColor,
                  color: currentTheme.textColor,
                }}
              >
                Adicionar Risco
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customRisks.map((risk, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    backgroundColor: risk.color,
                    color: getRiskTextColor(risk.name),
                  }}
                >
                  {risk.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filtros da Tabela */}
        <div className="flex flex-wrap gap-4 mb-6 items-center no-print">
          <input
            type="text"
            placeholder="Buscar atividade, disciplina, etc."
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.textColor,
              borderColor: currentTheme.tableBorder,
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.textColor,
              borderColor: currentTheme.tableBorder,
            }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos">Filtrar por Status Real</option>
            {/* Opções de status padrão + personalizados */}
            {[
              ...new Set([
                "Concluído",
                "Em Andamento",
                "Atrasado",
                "Não Iniciado",
                ...customStatuses.map((s) => s.name),
              ]),
            ].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.textColor,
              borderColor: currentTheme.tableBorder,
            }}
            value={filterResponsavel}
            onChange={(e) => setFilterResponsavel(e.target.value)}
          >
            <option value="Todos">Filtrar por Responsável</option>
            {uniqueResponsaveis.map((responsavel) => (
              <option key={responsavel} value={responsavel}>
                {responsavel}
              </option>
            ))}
          </select>
        </div>

        {/* Tabela Responsiva */}
        <div
          className="overflow-x-auto rounded-lg border"
          style={{ borderColor: currentTheme.tableBorder }}
        >
          <table
            className="min-w-full divide-y"
            style={{ borderColor: currentTheme.tableBorder }}
          >
            <thead style={{ backgroundColor: currentTheme.tableHeaderBg }}>
              <tr>
                {columnDefinitions.map(
                  (col) =>
                    visibleColumns[col.key] && (
                      <th
                        key={col.key}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {col.label}
                      </th>
                    )
                )}
              </tr>
            </thead>
            <tbody
              style={{
                backgroundColor: currentTheme.cardBackground,
                color: currentTheme.textColor,
                borderColor: currentTheme.tableBorder,
              }}
            >
              {activitiesWithCalculatedMetrics.length > 0 ? (
                activitiesWithCalculatedMetrics.map((activity) => (
                  <tr key={activity.id}>
                    {columnDefinitions.map((col) => {
                      if (!visibleColumns[col.key]) return null;

                      switch (col.key) {
                        case "atividade":
                        case "disciplina":
                        case "responsavel":
                        case "prioridade":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                              style={{ color: currentTheme.textColor }}
                            >
                              {activity[col.key]}
                            </td>
                          );
                        case "dataInicialPlanejada":
                        case "dataFinalPlanejada":
                        case "dataInicialReal":
                        case "dataFinalReal":
                        case "dataUltimaAtualizacao":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: currentTheme.secondaryTextColor }}
                            >
                              {formatDate(activity[col.key])}
                            </td>
                          );
                        case "valorPlanejado":
                        case "valorReal":
                        case "custoReal":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: currentTheme.secondaryTextColor }}
                            >
                              {formatCurrency(activity[col.key])}
                            </td>
                          );
                        case "statusPlanejado":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              <span
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{
                                  backgroundColor: getStatusBgColor(
                                    activity.statusPlanejado
                                  ),
                                  color: getStatusTextColor(
                                    activity.statusPlanejado
                                  ),
                                }}
                              >
                                {activity.statusPlanejado}
                              </span>
                            </td>
                          );
                        case "statusReal":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              <span
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{
                                  backgroundColor: getStatusBgColor(
                                    activity.statusReal
                                  ),
                                  color: getStatusTextColor(
                                    activity.statusReal
                                  ),
                                }}
                              >
                                {activity.statusReal}
                              </span>
                            </td>
                          );
                        case "percentualConclusao":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: currentTheme.secondaryTextColor }}
                            >
                              {activity[col.key]}%
                            </td>
                          );
                        case "riscoAssociado":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              <span
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{
                                  backgroundColor: getRiskBgColor(
                                    activity.riscoAssociado
                                  ),
                                  color: getRiskTextColor(
                                    activity.riscoAssociado
                                  ),
                                }}
                              >
                                {activity.riscoAssociado}
                              </span>
                            </td>
                          );
                        case "diasAtraso":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{
                                color:
                                  activity.diasAtraso > 0
                                    ? currentTheme.dangerColor
                                    : currentTheme.secondaryTextColor,
                              }}
                            >
                              {activity.diasAtraso}
                            </td>
                          );
                        case "diasRemanescentes":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{
                                color:
                                  activity.diasRemanescentes > 0
                                    ? currentTheme.secondaryColor
                                    : currentTheme.secondaryTextColor,
                              }}
                            >
                              {activity.diasRemanescentes}
                            </td>
                          );
                        case "recursosNecessarios":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: currentTheme.secondaryTextColor }}
                            >
                              {activity[col.key].join(", ")}
                            </td>
                          );
                        case "linkDocumento":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              {activity.linkDocumento ? (
                                <a
                                  href={activity.linkDocumento}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                  style={{ color: currentTheme.primaryColor }}
                                >
                                  Link
                                </a>
                              ) : (
                                <span
                                  style={{
                                    color: currentTheme.secondaryTextColor,
                                  }}
                                >
                                  N/A
                                </span>
                              )}
                            </td>
                          );
                        case "actions":
                          return (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                            >
                              <button
                                onClick={() => handleEditClick(activity)}
                                className="px-3 py-1 rounded-md border transition-colors duration-200"
                                style={{
                                  color: currentTheme.primaryColor,
                                  borderColor: currentTheme.primaryColor,
                                  backgroundColor: currentTheme.cardBackground,
                                }}
                              >
                                Editar
                              </button>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columnDefinitions.length}
                    className="px-6 py-4 text-center text-gray-500"
                    style={{ color: currentTheme.secondaryTextColor }}
                  >
                    Nenhuma atividade encontrada com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seção de Relatório (condicionalmente visível) */}
      {isReportSectionOpen && (
        <section
          id="report-content"
          className="p-6 rounded-lg shadow-md mt-8"
          style={{
            backgroundColor: currentTheme.cardBackground,
            color: currentTheme.textColor,
          }}
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Relatório de Atividades
          </h2>
          <p
            className="mb-2"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            Gerado em: {new Date().toLocaleDateString("pt-BR")}
          </p>
          <p
            className="mb-6"
            style={{ color: currentTheme.secondaryTextColor }}
          >
            Período do Relatório:{" "}
            {startDate && endDate
              ? `${formatDate(startDate)} a ${formatDate(endDate)}`
              : "Todo o Período"}
          </p>

          {/* Botão de Exportar para PDF */}
          <div className="flex justify-end mb-6 no-print">
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
              style={{
                backgroundColor: currentTheme.dangerColor,
                color: currentTheme.textColor,
              }}
              disabled={isGeneratingPdf || !pdfLibsLoaded}
            >
              {isGeneratingPdf ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Gerando PDF...
                </>
              ) : pdfLibsLoaded ? (
                "Exportar para PDF"
              ) : (
                "Carregando PDF..."
              )}
            </button>
          </div>

          {/* Análise de Observações */}
          <div
            className="p-4 rounded-lg shadow-inner mb-8"
            style={{ backgroundColor: currentTheme.background }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: currentTheme.textColor }}
            >
              Análise de Observações
            </h3>
            {isGeneratingAnalysis ? (
              <p
                className="text-sm italic"
                style={{ color: currentTheme.secondaryTextColor }}
              >
                Gerando análise...
              </p>
            ) : (
              <p
                className="text-sm"
                style={{ color: currentTheme.secondaryTextColor }}
              >
                {generatedAnalysis ||
                  "Nenhuma análise gerada. Abra o relatório para gerar a análise."}
              </p>
            )}
          </div>

          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: currentTheme.primaryColor + "1A",
                color: currentTheme.primaryColor,
              }}
            >
              <h3 className="text-lg font-semibold">Total de Atividades</h3>
              <p className="text-2xl font-bold">{totalActivities}</p>
            </div>
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: currentTheme.secondaryColor + "1A",
                color: currentTheme.secondaryColor,
              }}
            >
              <h3 className="text-lg font-semibold">Atividades Concluídas</h3>
              <p className="text-2xl font-bold">{completedActivities}</p>
            </div>
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: currentTheme.dangerColor + "1A",
                color: currentTheme.dangerColor,
              }}
            >
              <h3 className="text-lg font-semibold">Atividades Atrasadas</h3>
              <p className="text-2xl font-bold">{overdueActivities.length}</p>
            </div>
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: currentTheme.accentColor + "1A",
                color: currentTheme.accentColor,
              }}
            >
              <h3 className="text-lg font-semibold">Custo Total Real</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(totalRealCost)}
              </p>
            </div>
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: currentTheme.warningColor + "1A",
                color: currentTheme.warningColor,
              }}
            >
              <h3 className="text-lg font-semibold">Custo Total Planejado</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(totalPlannedCost)}
              </p>
            </div>
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: currentTheme.chartAccent + "1A",
                color: currentTheme.chartAccent,
              }}
            >
              <h3 className="text-lg font-semibold">Desvio de Custos</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(costDeviation)}
              </p>
            </div>
          </div>

          {/* Gráficos Reutilizados no Relatório */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div
              className="p-6 rounded-lg shadow-inner"
              style={{ backgroundColor: currentTheme.background }}
            >
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: currentTheme.textColor }}
              >
                Comparativo de Status (Planejado vs. Real)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={currentTheme.tableBorder}
                  />
                  <XAxis
                    dataKey="status"
                    stroke={currentTheme.secondaryTextColor}
                  />
                  <YAxis stroke={currentTheme.secondaryTextColor} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: currentTheme.cardBackground,
                      color: currentTheme.textColor,
                      border: `1px solid ${currentTheme.tableBorder}`,
                    }}
                  />
                  <Legend wrapperStyle={{ color: currentTheme.textColor }} />
                  <Bar
                    dataKey="Planejado"
                    fill={currentTheme.chartPrimary}
                    name="Planejado"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="Real"
                    fill={currentTheme.chartSecondary}
                    name="Real"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="p-6 rounded-lg shadow-inner"
              style={{ backgroundColor: currentTheme.background }}
            >
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: currentTheme.textColor }}
              >
                Conclusão por Disciplina (%)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={completionPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill={currentTheme.chartPrimary}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {completionPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value.toFixed(1)}%`}
                    contentStyle={{
                      backgroundColor: currentTheme.cardBackground,
                      color: currentTheme.textColor,
                      border: `1px solid ${currentTheme.tableBorder}`,
                    }}
                  />
                  <Legend wrapperStyle={{ color: currentTheme.textColor }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resumo de Custos por Disciplina */}
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Resumo de Custos por Disciplina
          </h3>
          {costChartData.length > 0 ? (
            <div
              className="overflow-x-auto rounded-lg border mb-8"
              style={{ borderColor: currentTheme.tableBorder }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: currentTheme.tableBorder }}
              >
                <thead
                  style={{ backgroundColor: currentTheme.primaryColor + "1A" }}
                >
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Disciplina
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Valor Planejado
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Valor Real
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Desvio
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.tableBorder,
                  }}
                >
                  {costChartData.map((data, index) => (
                    <tr key={index}>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{ color: currentTheme.textColor }}
                      >
                        {data.disciplina}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {formatCurrency(data.Planejado)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {formatCurrency(data.Real)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{
                          color:
                            data.Real - data.Planejado > 0
                              ? currentTheme.dangerColor
                              : currentTheme.secondaryColor,
                        }}
                      >
                        {formatCurrency(data.Real - data.Planejado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className="mb-8"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Nenhum resumo de custos por disciplina disponível.
            </p>
          )}

          {/* Resumo de Atividades por Prioridade */}
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Resumo de Atividades por Prioridade
          </h3>
          {priorityChartData.length > 0 ? (
            <div
              className="overflow-x-auto rounded-lg border mb-8"
              style={{ borderColor: currentTheme.tableBorder }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: currentTheme.tableBorder }}
              >
                <thead
                  style={{ backgroundColor: currentTheme.chartPriority + "1A" }}
                >
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.chartPriority }}
                    >
                      Prioridade
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.chartPriority }}
                    >
                      Número de Atividades
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.tableBorder,
                  }}
                >
                  {priorityChartData.map((data, index) => (
                    <tr key={index}>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{ color: currentTheme.textColor }}
                      >
                        {data.name}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {data.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className="mb-8"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Nenhum resumo de atividades por prioridade disponível.
            </p>
          )}

          {/* Resumo de Atividades por Risco */}
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Resumo de Atividades por Risco
          </h3>
          {riskChartData.length > 0 ? (
            <div
              className="overflow-x-auto rounded-lg border mb-8"
              style={{ borderColor: currentTheme.tableBorder }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: currentTheme.tableBorder }}
              >
                <thead
                  style={{ backgroundColor: currentTheme.chartRisk + "1A" }}
                >
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.chartRisk }}
                    >
                      Risco
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.chartRisk }}
                    >
                      Número de Atividades
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.tableBorder,
                  }}
                >
                  {riskChartData.map((data, index) => (
                    <tr key={index}>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{ color: currentTheme.textColor }}
                      >
                        {data.name}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {data.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className="mb-8"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Nenhum resumo de atividades por risco disponível.
            </p>
          )}

          {/* Atividades Atrasadas */}
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Atividades Atrasadas
          </h3>
          {overdueActivities.length > 0 ? (
            <div
              className="overflow-x-auto rounded-lg border mb-8"
              style={{ borderColor: currentTheme.tableBorder }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: currentTheme.tableBorder }}
              >
                <thead
                  style={{ backgroundColor: currentTheme.dangerColor + "1A" }}
                >
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.dangerColor }}
                    >
                      Atividade
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.dangerColor }}
                    >
                      Responsável
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.dangerColor }}
                    >
                      Data Final Planejada
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.dangerColor }}
                    >
                      Status Real
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.dangerColor }}
                    >
                      Dias Atraso
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.tableBorder,
                  }}
                >
                  {overdueActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{ color: currentTheme.textColor }}
                      >
                        {activity.atividade}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {activity.responsavel}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {formatDate(activity.dataFinalPlanejada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: getStatusBgColor(
                              activity.statusReal
                            ),
                            color: getStatusTextColor(activity.statusReal),
                          }}
                        >
                          {activity.statusReal}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.dangerColor }}
                      >
                        {activity.diasAtraso}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className="mb-8"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Nenhuma atividade atrasada encontrada.
            </p>
          )}

          {/* Atividades com Dias Remanescentes */}
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Atividades com Dias Remanescentes
          </h3>
          {remainingDaysActivities.length > 0 ? (
            <div
              className="overflow-x-auto rounded-lg border mb-8"
              style={{ borderColor: currentTheme.tableBorder }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: currentTheme.tableBorder }}
              >
                <thead
                  style={{
                    backgroundColor: currentTheme.secondaryColor + "1A",
                  }}
                >
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.secondaryColor }}
                    >
                      Atividade
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.secondaryColor }}
                    >
                      Responsável
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.secondaryColor }}
                    >
                      Data Final Planejada
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.secondaryColor }}
                    >
                      Status Real
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.secondaryColor }}
                    >
                      Dias Remanescentes
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.tableBorder,
                  }}
                >
                  {remainingDaysActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{ color: currentTheme.textColor }}
                      >
                        {activity.atividade}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {activity.responsavel}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryTextColor }}
                      >
                        {formatDate(activity.dataFinalPlanejada)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: getStatusBgColor(
                              activity.statusReal
                            ),
                            color: getStatusTextColor(activity.statusReal),
                          }}
                        >
                          {activity.statusReal}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: currentTheme.secondaryColor }}
                      >
                        {activity.diasRemanescentes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className="mb-8"
              style={{ color: currentTheme.secondaryTextColor }}
            >
              Nenhuma atividade com dias remanescentes encontrada.
            </p>
          )}

          {/* Atividades por Responsável (Resumo Tabular) */}
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: currentTheme.textColor }}
          >
            Resumo de Atividades por Responsável
          </h3>
          {Object.keys(activitiesByResponsibleSummary).length > 0 ? (
            <div
              className="overflow-x-auto rounded-lg border"
              style={{ borderColor: currentTheme.tableBorder }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: currentTheme.tableBorder }}
              >
                <thead
                  style={{ backgroundColor: currentTheme.primaryColor + "1A" }}
                >
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Responsável
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Total
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Concluído
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Em Andamento
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Atrasado
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Não Iniciado
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.tableBorder,
                  }}
                >
                  {Object.entries(activitiesByResponsibleSummary).map(
                    ([responsavel, summary]) => (
                      <tr key={responsavel}>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                          style={{ color: currentTheme.textColor }}
                        >
                          {responsavel}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm"
                          style={{ color: currentTheme.secondaryTextColor }}
                        >
                          {summary.total}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm"
                          style={{ color: currentTheme.secondaryTextColor }}
                        >
                          {summary.concluido}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm"
                          style={{ color: currentTheme.secondaryTextColor }}
                        >
                          {summary.emAndamento}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm"
                          style={{ color: currentTheme.secondaryTextColor }}
                        >
                          {summary.atrasado}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm"
                          style={{ color: currentTheme.secondaryTextColor }}
                        >
                          {summary.naoIniciado}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="" style={{ color: currentTheme.secondaryTextColor }}>
              Nenhum resumo por responsável disponível.
            </p>
          )}
        </section>
      )}

      {/* Renderiza o modal de edição se isEditModalOpen for true */}
      {isEditModalOpen && (
        <EditActivityModal
          activity={currentActivityToEdit}
          onClose={handleCloseEditModal}
          onSave={handleSaveActivity}
          customStatuses={customStatuses}
          customRisks={customRisks}
          currentTheme={currentTheme}
        />
      )}

      {/* Renderiza o modal de adição se isAddModalOpen for true */}
      {isAddModalOpen && (
        <AddActivityModal
          onClose={handleCloseAddModal}
          onSave={handleAddNewActivity}
          customStatuses={customStatuses}
          customRisks={customRisks}
          currentTheme={currentTheme}
        />
      )}

      {/* Tailwind CSS Script (para garantir que o Tailwind funcione) */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Configuração da fonte Inter */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          /* Estilos para impressão */
          @media print {
            body > *:not(#report-content) {
              display: none; /* Oculta tudo que não for o conteúdo do relatório */
            }
            #report-content {
              display: block; /* Garante que o relatório seja exibido */
              width: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none;
              border-radius: 0;
            }
            .no-print {
              display: none !important; /* Força a ocultação de elementos com esta classe */
            }
            /* Ajustes para tabelas e gráficos na impressão */
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              font-size: 0.75em; /* Reduz o tamanho da fonte para caber mais conteúdo */
            }
            .recharts-responsive-container {
              width: 100% !important;
              height: 200px !important; /* Altura fixa para gráficos na impressão */
              margin-bottom: 10px;
            }
            /* Garante que o texto em cores personalizadas seja legível */
            .px-2.inline-flex.text-xs.leading-5.font-semibold.rounded-full {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            /* Quebra de página para seções do relatório */
            h2 {
                page-break-before: always; /* Inicia nova página para cada título de seção principal */
            }
            h3 {
                page-break-after: avoid; /* Evita que o título da subseção seja a última coisa na página */
            }
            .grid {
                display: block; /* Desabilita o grid para impressão para melhor fluxo */
            }
            .grid > div {
                width: 100%; /* Faz com que os cards ocupem a largura total */
                margin-bottom: 10px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default App;
