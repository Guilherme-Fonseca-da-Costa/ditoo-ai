import React, { useState } from "react";
import "../assets/configPage.css";
import { api } from "../services/api";

export default function Config() {
  const [selectedConfig, setSelectedConfig] = useState("user");
  const [isAdmin] = useState(true); // Simulação de permissão de admin, vou substituir por lógica real
  const [model, setModel] = useState("deepseek-r1:8b");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [role, setRole] = useState("user")

  function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (password === confirmPassword) {
      api.register(userName, email, password, role);
    }
  }
  return (
    <div id="configPage">
      <div id="configSideBar">
        <button
          className={`configSideBarButton ${selectedConfig === "user" ? "configSideBarButtonOn" : "configSideBarButtonOff"}`}
          onClick={() => setSelectedConfig("user")}
        >
          <h4>Configurações de Usuário</h4>
        </button>
        <button
          className={`configSideBarButton ${selectedConfig === "system" ? "configSideBarButtonOn" : "configSideBarButtonOff"}`}
          onClick={() => isAdmin && setSelectedConfig("system")}
          disabled={!isAdmin}
        >
          <h4>Configurações de Sistema</h4>
        </button>
      </div>
      <div id="configBlock">
        {selectedConfig === "user" ? (
          <div id="userConfig">
            <h1>Configurações de Usuário</h1>
          </div>
        ) : (
          <div id="systemConfig">
            <h1>Configurações de Sistema</h1>
            <div>
              <label htmlFor="requestParalel">
                <h3>Paralelismo de Requisições</h3>
                <input
                  type="number"
                  id="requestParalel"
                  name="requestParalel"
                  min={1}
                  max={10}
                  defaultValue={3}
                />
              </label>
              <p>
                Defina o número máximo de requisições que podem ser processadas
                simultaneamente pelo Ditoo.
              </p>
              <p>
                Atenção: Este campo impacta diretamente a performance do
                sistema. Quanto maior o valor, maior será a carga no hardware
                que hospeda o serviço.
              </p>
            </div>
            <h3>Seletor de LLM</h3>
            <select
              id="modelSelector"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="deepseek-r1:8b">DeepSeek R1 8B</option>
              <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B</option>
              <option value="llama3.2:3b">Llama 3.2 3B</option>
              <option value="qwen2.5:7b">Qwen 2.5 7B</option>
            </select>

            <div id="foldersConfig">
              <h3>Configurações de Pastas</h3>
              <div id="normalFolders">
                <div className="folderConfigItem">
                  <h4>Definir pastas normais</h4>
                  <h4>Ditoo/documentos</h4>
                  <button className="editFolderButton">Editar</button>
                  <button className="deleteFolderButton">Excluir</button>
                </div>
              </div>
              <div id="secretFolders">
                <div className="folderConfigItem">
                  <h4>Definir pastas secretas</h4>
                  <h4>Ditoo/documentos/Notas Fiscais</h4>
                  <button className="editFolderButton">Editar</button>
                  <button className="deleteFolderButton">Excluir</button>
                </div>
              </div>
            </div>

            <div id="usersList">
              <h3>Lista de Usuários</h3>
              <div className="userListItem">
                <h4>João Silva -Administrador</h4>
                <h4>Email: joao.silva@example.com</h4>
                <button className="rePass">Redefinir senha</button>
                <button className="editUserButton">Editar</button>
                <button className="deleteUserButton">Excluir</button>
              </div>
            </div>

            <form id="userCreatorForm">
              <input
                className="userCreatorInput"
                placeholder="Nome do usuário"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
              <input
                className="userCreatorInput"
                placeholder="Email do usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="userCreatorInput"
                placeholder="Senha do usuário"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                className="userCreatorInput"
                placeholder="Confirme a senha do usuário"
                value={confirmPassword}
                onChange={(e) => setconfirmPassword(e.target.value)}
                required
              />
              <select name="userType" id="userTypeSelector">
                <option onSelect={() => (setRole("user"))} value="user">Usuário Comum</option>
                <option onSelect={() => (setRole("admin"))} value="admin">Administrador</option>
              </select>
              <button onClick={createUser} id="createUserButton">
                Criar usuário
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
