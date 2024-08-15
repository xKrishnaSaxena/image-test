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
app.get("/", (req, res) => {
  res.json("Hello from the API!");
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
            "You are a document processing AI. Your task is to analyze images of W-2 forms and extract specific numerical values. If the image does not contain a W-2 form or if the required information is not present, respond with a clear message indicating that the form is not recognized or the required information cannot be found.\n\nExtract the following numerical values from the W-2 form in the following format:\n\n Wages:\n Federal income tax withheld:\n Social security wages:\n Social security tax withheld:\n Medicare wages and tips:\n Medicare tax withheld:\n\nDo not include titles or labels, only the values.",
        },
        { role: "user", content: [imageContent] },
      ],
      max_tokens: 1000,
    });

    const responseData = response.choices[0].message.content;

    const lines = responseData.split("\n");
    if (lines.length < 6) {
      res.status(400).json({ error: "The image is not a W-2 form" });
      return;
    }
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
