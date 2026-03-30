export default function LoginPage() {
  return (
    <div id="loginBlock">
      <h1 style={{ color: '#929292', userSelect: 'none' }}>Login</h1>
      <div id="inputLoginBlock">
        <input
          className="loginInput"
          type="email"
          name="email"
          id="email"
          placeholder="Email"
        />
        <input
          className="loginInput"
          type="password"
          name="password"
          id="password"
          placeholder="Password"
        />
      </div>

      <a href="/api/auth/google">
        <button style={{
          marginBottom: 20,
          borderRadius : 25,
          padding: "10px 20px",
          fontFamily: "Google-sans",
          fontWeight: "bold",
          border: "none",
          backgroundColor: "#6e6e6e",
          color: "white",
          cursor: "pointer",
        }} id="loginButton">Entrar</button>
      </a>
    </div>
  );
}
