import fetch from "node-fetch";

export async function sendEmail() {
  let url = "https://api.sendinblue.com/v3/smtp/email";

  const body = JSON.stringify({
    sender: {
      name: "KegerWeighter",
      email: "info@thekegerweighter.com",
    },
    to: [{ email: "josephtoeniskoetter@gmail.com" }],
    replyTo: {
      email: "info@thekegerweighter.com",
      name: "KegerWeighter",
    },
    subject: "Password Reset Request",
    textContent: "test",
  });

  let options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key":
        "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",
    },
    body,
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => console.log(json))
    .catch((err) => console.error("error:" + err));
}
