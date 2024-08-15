const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const port = process.env.PORT || 3000;

app.use(cors());

const uploadsDirImg = path.join(__dirname, "ImgUploads");

if (!fs.existsSync(uploadsDirImg)) {
  fs.mkdirSync(uploadsDirImg, { recursive: true });
}

const supportedImageTypes = ["image/png", "image/jpeg", "image/jpg"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (supportedImageTypes.includes(file.mimetype)) {
      cb(null, uploadsDirImg);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/askAboutImages", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded or unsupported file type");
    }
    const imageFilePath = req.file.path;

    const imageAsBase64 = fs.readFileSync(imageFilePath, "base64");
    const imageContent = {
      type: "image_url",
      image_url: `data:image/png;base64,${imageAsBase64}`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content:
            "Provide all the relevant information.\nGenerate the invoice in the following format:\n\nWages,tips,other compensation:\nFederal income tax withheld:\nSocial security wages:\nSocial security tax withheld:\nMedicare wages and tips:\nMedicare tax withheld:\nFormat dont have the titles of the categories just output the requested values.",
        },
        { role: "user", content: [imageContent] },
      ],
      max_tokens: 1000,
    });

    const responseData = response.choices[0].message.content;
    const lines = responseData.split("\n");
    const Wages = lines[0];
    const FederalIncomeTaxWitheld = lines[1];
    const SocialSecurityWages = lines[2];
    const SocialSecurityTaxWithheld = lines[3];
    const MedicareWagesAndTips = lines[4];
    const MedicareTaxWithheld = lines[5];

    res.json({
      Wages,
      FederalIncomeTaxWitheld,
      SocialSecurityWages,
      SocialSecurityTaxWithheld,
      MedicareWagesAndTips,
      MedicareTaxWithheld,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
