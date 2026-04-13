interface Props{
    text: string
}

export default function Alert({ text }: Props) {
  return (
    <div className="alert">
      <svg
      width="30"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#ffffff"
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="#ffffff"
            stroke-width="2"
          ></path>{" "}
          <path
            d="M12 8L12 13"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linecap="round"
          ></path>{" "}
          <path
            d="M12 16V15.9888"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linecap="round"
          ></path>{" "}
        </g>
      </svg>
      <h4>{text}</h4>
    </div>
  );
}
