import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";

import { ReactComponent as PetsSVG } from "../assets/cat-and-dog.svg";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/cards");
      toast.success("Logado com sucesso!", {
        position: "top-center",
      });
    } catch (error) {
      console.error(error.message);
      toast.error("Email ou senha incorretos.", {
        position: "bottom-center",
      });
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      <div className="w-full flex items-center justify-center lg:w-1/2">
        <div className="bg-white px-10 py-20 rounded-3xl border-2 border-gray-200">
          <h1 className="text-5xl font-semibold">Bem-vindo de volta!</h1>
          <p className="font-medium text-lg text-gray-500 mt-4">
            Digite seu email e senha para entrar no Petslife.
          </p>
          <div className="mt-8">
            <form onSubmit={handleSubmit}>
              <div>
                <label className="text-lg font-medium">Email:</label>
                <input
                  className="w-full border-2 border-gray-100 rounded-xl p-4 mt-1 bg-transparent"
                  placeholder="Digite seu email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-lg font-medium">Senha:</label>
                <input
                  className="w-full border-2 border-gray-100 rounded-xl p-4 mt-1 bg-transparent"
                  placeholder="Digite sua senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mt-8 flex flex-col gap-y-4">
                <button className="active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01] ease-in-out py-3 rounded-xl bg-orange-400 text-white text-lg font-bold">
                  Entrar
                </button>
              </div>
              <div className="mt-8 flex justify-center items-center">
                <p className="fonte-medium text-base">
                  Ainda não tem uma conta?
                </p>
                <Link
                  to="/register"
                  className="text-orange-400 text-base font-medium ml-2"
                >
                  Cadastre-se
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="hidden relative lg:flex min-h-screen w-1/2 items-center justify-cente">
        <PetsSVG alt="Imagem de um cachorro e um gato" className="" />
      </div>
    </div>
  );
};

export default Login;
