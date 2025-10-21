"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

interface Subject {
    id: number;
    name: string;
    type: string;
    totalWorkloadHours: number;
    classDurationHours: number;
    totalClasses: number;
    absences: number;
}

interface AbsenceRecord {
    id: number;
    date: string;
    subjectId: number;
}


const api = axios.create({ baseURL: "https://controle-faltas-app-ecql.onrender.com" });

api.interceptors.request.use(config => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

function ProgressBar({ percent }: { percent: number }) {
    const color = percent < 10 ? 'bg-emerald-500' : percent < 20 ? 'bg-amber-400' : 'bg-rose-500';

    return (
        <div className="w-full h-2 bg-gray-300 rounded-full my-3 overflow-hidden">
            <div 
                className={`h-full ${color} transition-all duration-500`} 
                style={{ width: `${percent}%` }}
            ></div>
        </div>
    );
}

function WelcomeBanner() {
    return (
        <div className="bg-violet-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl mb-8 flex justify-between items-center relative overflow-hidden">
            
            <div>
                <h2 className="text-3xl font-extrabold mb-1">
                    Olá! Bem-vindo(a) ao seu Dashboard Acadêmico.
                </h2>
                <p className="text-violet-200 text-sm sm:text-base max-w-lg">
                    Seu foco: Manter o limite de faltas abaixo de 25% para evitar a reprovação.
                </p>
            </div>

            <div className="absolute top-0 right-0 h-full w-1/3 opacity-30">
                <div className="w-16 h-16 bg-violet-500 rounded-full absolute top-4 right-4"></div>
                <div className="w-24 h-24 bg-violet-500 rounded-full absolute bottom-2 right-12"></div>
            </div>
        </div>
    );
}


function GlobalSummary({ subjects }: { subjects: Subject[] }) {
    const totalSubjects = subjects.length;
    const totalAbsences = subjects.reduce((sum, s) => sum + s.absences, 0);
    const subjectsInAlert = subjects.filter(s => (s.absences / s.totalClasses) * 100 >= 25).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 border-t-4 border-violet-600">
                <p className="text-sm font-semibold text-gray-500">Total de Cadeiras</p>
                <p className="text-3xl font-extrabold text-violet-700 mt-1">{totalSubjects}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 border-t-4 border-gray-400">
                <p className="text-sm font-semibold text-gray-500">Faltas Registradas</p>
                <p className="text-3xl font-extrabold text-gray-700 mt-1">{totalAbsences}</p>
            </div>
            <div className={`p-6 rounded-2xl shadow-xl transition duration-300 border-t-4 ${subjectsInAlert > 0 ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
                <p className="text-sm font-semibold text-gray-700">Cadeiras em Risco (≥ 25%)</p>
                <p className={`text-3xl font-extrabold mt-1 ${subjectsInAlert > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{subjectsInAlert}</p>
            </div>
        </div>
    );
}

function SubjectFormModal({ onClose, reload, subjectToEdit }: { onClose: () => void, reload: () => void, subjectToEdit?: Subject | null }) {
    
    const isEditing = !!subjectToEdit;

    const [values, setValues] = useState<Partial<Subject>>({ 
        name: subjectToEdit?.name || "", 
        type: subjectToEdit?.type || "Semestre", 
        totalWorkloadHours: subjectToEdit?.totalWorkloadHours || 60,
        classDurationHours: subjectToEdit?.classDurationHours || 2,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues({ ...values, [e.target.name]: e.target.value });
    
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!values.name || !values.totalWorkloadHours || !values.classDurationHours) {
             return alert("Por favor, preencha todos os campos obrigatórios.");
        }

        try {
            if (isEditing) {
                await api.put(`/subjects/${subjectToEdit!.id}`, values);
            } else {
                await api.post("/subjects", values); 
            }
            reload();
            onClose();
        } catch (error) {
            alert(`Erro ao ${isEditing ? 'editar' : 'adicionar'} cadeira. Verifique o console.`);
            console.error(error);
        }
    };
    
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-3xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-3xl font-extrabold mb-8 text-violet-700">{isEditing ? 'Editar Matéria' : 'Nova Matéria'}</h2>
                <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                    <input 
                        name="name" 
                        placeholder="Nome da Cadeira" 
                        value={values.name} 
                        onChange={handleChange} 
                        className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500" 
                    />
                    
                    <select 
                        name="type" 
                        value={values.type} 
                        onChange={handleChange} 
                        className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500 bg-white"
                    >
                        <option value="Trimestre">Trimestre</option>
                        <option value="Semestre">Semestre</option>
                        <option value="Anual">Anual</option>
                    </select>

                    <input 
                        type="number" 
                        name="totalWorkloadHours" 
                        placeholder="Carga Horária Total (Horas)" 
                        value={values.totalWorkloadHours} 
                        onChange={handleChange} 
                        className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500" 
                        min={1}
                    />

                    <input 
                        type="number" 
                        name="classDurationHours" 
                        placeholder="Duração de uma aula (Horas)" 
                        value={values.classDurationHours} 
                        onChange={handleChange} 
                        className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500" 
                        min={0.5} 
                        step={0.5}
                    />

                    <button 
                        className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3 rounded-xl mt-3 transition shadow-lg shadow-violet-300/50" 
                        type="submit"
                    >
                        {isEditing ? 'Salvar Edição' : 'Adicionar Matéria'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-sm text-gray-500 hover:text-gray-700 mt-1"
                    >
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
}

function SubjectDetailModal({ subject, onClose, reloadParent }: { subject: Subject, onClose: () => void, reloadParent: () => void }) {
    const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<AbsenceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRecords = async () => {
        try {
            const { data } = await api.get(`/subjects/${subject.id}/absences`);
            setRecords(data);
        } catch (error) {
            console.error("Erro ao buscar registros de faltas:", error);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [subject.id]);

    const handleAddAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!absenceDate) return alert("Selecione uma data para registrar a falta.");
        
        setIsLoading(true);
        try {
            const { data } = await api.post(`/subjects/${subject.id}/absences`, { date: absenceDate });
            
            setRecords(prev => [...prev, data]); 
            
            reloadParent(); 
            setAbsenceDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            alert("Falha ao registrar a falta. Verifique se já registrou neste dia.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRecord = async (recordId: number) => {
        if (!window.confirm("Confirmar exclusão da falta nesta data?")) return;

        try {
            await api.delete(`/subjects/${subject.id}/absences/${recordId}`);
            
            setRecords(prev => prev.filter(r => r.id !== recordId));
            reloadParent(); 
        } catch (error) {
            alert("Falha ao excluir o registro.");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-3 border-gray-200">
                    <h2 className="text-3xl font-extrabold text-violet-700">{subject.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-violet-700 text-3xl leading-none">&times;</button>
                </div>

                <div className="bg-violet-50 p-4 rounded-xl mb-6 grid grid-cols-2 gap-y-2 border border-violet-200">
                    <p className="font-semibold text-violet-700">CHT: <span className="font-bold">{subject.totalWorkloadHours}h</span></p>
                    <p className="font-semibold text-violet-700">Duração/Aula: <span className="font-bold">{subject.classDurationHours}h</span></p>
                    <p className="font-semibold text-violet-700">Aulas Totais: <span className="font-bold">{subject.totalClasses}</span></p>
                    <p className="font-semibold text-violet-700">Faltas Registradas: <span className="font-bold">{subject.absences}</span></p>
                </div>

                <form onSubmit={handleAddAbsence} className="flex gap-4 mb-8 p-4 border rounded-xl bg-gray-50 items-center">
                    <input 
                        type="date" 
                        value={absenceDate} 
                        onChange={(e) => setAbsenceDate(e.target.value)}
                        className="p-3 border border-gray-300 rounded-xl flex-grow focus:ring-violet-500 focus:border-violet-500"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl transition disabled:opacity-50 shadow-md"
                    >
                        {isLoading ? 'Registrando...' : 'Marcar Falta'}
                    </button>
                </form>

                <h3 className="text-xl font-bold mb-4 text-gray-700">Histórico de Faltas ({records.length})</h3>
                <div className="space-y-3">
                    {records.length === 0 ? (
                        <p className="text-gray-500 italic text-center">Nenhuma falta registrada até o momento. Livre de faltas!</p>
                    ) : (
                        <ul className="divide-y divide-gray-200 border border-gray-100 rounded-xl p-3">
                            {records
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((record) => (
                                <li key={record.id} className="flex justify-between items-center py-3">
                                    <span className="text-gray-700 font-medium">{formatDate(record.date)}</span>
                                    <button
                                        onClick={() => handleDeleteRecord(record.id)}
                                        className="text-rose-500 hover:text-rose-700 p-1 rounded transition text-sm font-semibold"
                                        title="Excluir este registro"
                                    >
                                        Excluir
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [reloadFlag, setReloadFlag] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

    useEffect(() => {
        const f = async () => {
            try {
                const { data } = await api.get("/subjects");
                const processedData: Subject[] = data.map((s: any) => ({
                    ...s,
                    totalClasses: s.classDurationHours > 0 ? Math.floor(s.totalWorkloadHours / s.classDurationHours) : s.totalWorkloadHours,
                }));
                setSubjects(processedData);
            } catch {
                window.location.href = "/login";
            }
        };
        f();
    }, [reloadFlag]);
    
    const deleteSubject = async (id: number, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a cadeira "${name}"? Esta ação é irreversível.`)) {
            try {
                await api.delete(`/subjects/${id}`);
                setReloadFlag(x => !x);
            } catch (error) {
                alert("Erro ao excluir a cadeira.");
            }
        }
    };

    const handleExport = () => {
        const sheet = XLSX.utils.json_to_sheet(subjects.map(s => ({
            Nome: s.name,
            Tipo: s.type,
            CargaHoraria: s.totalWorkloadHours,
            AulasFaltadas: s.absences,
            AulasTotais: s.totalClasses
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, "ControleFaltas");
        XLSX.writeFile(wb, "controle_faltas.xlsx");
    };

    const openFormModal = (subject?: Subject) => {
        setSubjectToEdit(subject || null);
        setShowModal(true);
    };

    const openDetailModal = (subject: Subject) => {
        setSelectedSubject(subject);
        setShowDetailModal(true);
    };
    
    const handleCloseFormModal = () => {
        setShowModal(false);
        setSubjectToEdit(null);
    };

    const filteredSubjects = useMemo(() => {
        if (!searchTerm) return subjects;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return subjects.filter(s =>
            s.name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [subjects, searchTerm]);

    return (
        <div className="min-h-screen bg-gray-100 p-6 sm:p-10">
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-300">
                <h1 className="text-4xl font-extrabold text-violet-800 mb-4 sm:mb-0">
                    Acadêmico | Controle de Faltas 📊
                </h1>
                <div className="flex flex-wrap gap-3">
                    <button className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2 rounded-lg transition shadow-md" onClick={() => openFormModal()}>
                        + Nova Matéria
                    </button>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-4 py-2 rounded-lg transition" onClick={handleExport}>
                        Exportar Excel
                    </button>
                    <button className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded-lg transition" onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
                        Sair
                    </button>
                </div>
            </header>

            <WelcomeBanner /> 

            <GlobalSummary subjects={subjects} /> 

            <div className="mb-8">
                <input
                    type="text"
                    placeholder="🔍 Buscar matéria por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500 shadow-lg"
                />
            </div>

            {filteredSubjects.length === 0 && (
                <p className="text-gray-500 text-center mt-10">Nenhuma matéria encontrada ou a lista está vazia. Adicione a primeira!</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSubjects.map(s => {
                    const percent = s.totalClasses > 0 ? (100 * s.absences / s.totalClasses) : 0;
                    const isAlert = percent >= 25;
                    const remainingClasses = s.totalClasses * 0.25 - s.absences;

                    return (
                        <div 
                            key={s.id} 
                            className={`p-6 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 flex flex-col justify-between 
                                ${isAlert ? 'ring-2 ring-rose-500' : 'hover:ring-2 hover:ring-violet-400'} border border-gray-200`}
                        >
                            <div className="flex justify-between items-start">
                                <h2 onClick={() => openDetailModal(s)} className="font-extrabold text-xl text-gray-800 truncate mb-1 cursor-pointer hover:text-violet-600">
                                    {s.name}
                                </h2>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openFormModal(s); }}
                                        className="text-gray-500 hover:text-violet-600 p-1 rounded transition"
                                        title="Editar Matéria"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 17.653 7.5 17.5l-.5.5-2.25 2.25a.75.75 0 0 1-1.06 0l-.75-.75a.75.75 0 0 1 0-1.06l2.25-2.25.5-.5.153-3.082 1.687 1.687Z" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSubject(s.id, s.name); }}
                                        className="text-rose-500 hover:text-rose-700 p-1 rounded transition"
                                        title="Excluir Matéria"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.262 9m1.745-6.995l-1.464-.732m-5.184 0l-1.464.732m3.678 12.63l-.75-.75M7.5 7.5V4.5a2.25 2.25 0 0 1 2.25-2.25h3a2.25 2.25 0 0 1 2.25 2.25v3M4.5 9h15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-sm text-violet-600 font-semibold mb-3">{s.type} | Carga Horária: {s.totalWorkloadHours}h</p>
                            
                            <ProgressBar percent={percent} />
                            
                            <div className="mt-3">
                                <p className={`text-sm ${isAlert ? "text-rose-700 font-extrabold" : "text-gray-600"}`}>
                                    **{percent.toFixed(1)}% de faltas** ({s.absences} / {s.totalClasses})
                                </p>
                                <p className={`text-xs mt-1 ${remainingClasses <= 0 ? "text-rose-700 font-bold" : "text-gray-500"}`}>
                                    Aulas restantes (limite de 25%): {Math.max(0, remainingClasses).toFixed(0)}
                                </p>
                            </div>
                            
                            <button
                                onClick={() => openDetailModal(s)}
                                className="mt-4 w-full bg-violet-50 hover:bg-violet-100 text-violet-600 py-2 rounded-xl text-sm font-medium transition"
                            >
                                Registrar/Ver Faltas por Data
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {showModal && (
                <SubjectFormModal 
                    onClose={handleCloseFormModal} 
                    reload={() => setReloadFlag(x => !x)} 
                    subjectToEdit={subjectToEdit} 
                />
            )}

            {showDetailModal && selectedSubject && (
                <SubjectDetailModal 
                    subject={selectedSubject} 
                    onClose={() => setShowDetailModal(false)} 
                    reloadParent={() => setReloadFlag(x => !x)} 
                />
            )}
        </div>
    );
}