const form = document.getElementById("formUpload");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const inputFile = document.getElementById("arquivo");
  const file = inputFile.files[0];

  if (!file) {
    alert("Selecione um arquivo");
    return;
  }

  const formData = new FormData();
  formData.append("arquivo", file);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.erro);
      return;
    }

    console.log(data);

    form.reset();

  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro ao conectar com o servidor.");
  }
});
