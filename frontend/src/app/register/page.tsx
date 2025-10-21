"use client";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Register() {
    const { register, handleSubmit } = useForm();
    const router = useRouter();

    const onSubmit = async (data: any) => {
        try {
            await axios.post("http://localhost:4000/api/users/register", data);
            alert("Registrado com sucesso! Faça login.");
            router.push("/login");
        } catch {
            alert("Erro ao registrar. Email pode já estar em uso.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex">
                
                <div className="hidden md:flex md:w-1/2 bg-violet-600 p-12 flex-col justify-center text-white">
                    <div className="mb-10">
                        <h2 className="text-4xl font-extrabold mb-3">🎓 Controle de Faltas Acadêmico</h2>
                        <p className="text-violet-200 text-lg">Sistema de Gestão de Presença e Risco.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">📚</span>
                            <p className="font-semibold">Seu primeiro passo para o sucesso acadêmico.</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🔒</span>
                            <p className="font-semibold">Seus dados são privados e seguros.</p>
                        </div>
                    </div>
                    
                    <div className="mt-12 text-center text-violet-300 italic text-sm">
                        Crie sua conta e comece a monitorar suas disciplinas.
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 sm:p-12">
                    <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-10">
                        Criar Nova Conta
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                        <input 
                            placeholder="Seu Nome Completo" 
                            {...register("name")} 
                            className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500 transition" 
                        />
                        <input 
                            placeholder="Seu E-mail Acadêmico" 
                            {...register("email")} 
                            className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500 transition" 
                        />
                        <input 
                            type="password" 
                            placeholder="Crie uma Senha Forte" 
                            {...register("password")} 
                            className="p-3 border border-gray-300 rounded-xl focus:ring-violet-500 focus:border-violet-500 transition" 
                        />
                        <button 
                            className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3 rounded-xl transition shadow-lg mt-4"
                            type="submit"
                        >
                            REGISTRAR
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <a href="/login" className="text-violet-600 hover:text-violet-800 font-medium underline transition text-sm">
                            Já possui conta? Clique para Logar.
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}