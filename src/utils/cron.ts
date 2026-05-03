import https from "https";

const backenUrl = "https://e-library-api-ei1z.onrender.com";
const keepTheServerAlive = () => {
  https.get(backenUrl).on("error", (err) => {});
};

export default keepTheServerAlive;
