import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseStreamCommandInput,
  ConverseStreamCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

const config = {
  region: "us-west-2",
  credentials: {
    accessKeyId: "AKIAQKPIMC2ZRN7364VQ",
    secretAccessKey: process.env.AWS_KEY!,
  },
};

const client = new BedrockRuntimeClient(config);

type ChunkCallback = (
  chunk: string | { preamble: string; content: string },
  isFinal?: boolean
) => void;

async function processStream(
  response: ConverseStreamCommandOutput,
  onChunk: ChunkCallback
) {
  if (!response.stream) {
    return;
  }

  let content = "";

  try {
    for await (const chunk of response.stream) {
      if (
        chunk.contentBlockDelta &&
        chunk.contentBlockDelta.delta &&
        chunk.contentBlockDelta.delta.text
      ) {
        const text = chunk.contentBlockDelta.delta.text;
        content += text;
        onChunk(text);
      }
    }
    const formattedContent = formatLatexContent(content);
    onChunk(formattedContent, true); // true flag indicates this is the final chunk
  } catch (error) {
    console.error("Error processing stream:", error);
  }
}

export async function textHandler(
  textInput: string,
  imgArray: Uint8Array,
  onChunk: ChunkCallback
) {
  const prompt =
    "You are a helpful LLM guiding a student learning from a textbook. Use the context of the image (a screenshot of a section of a textbook) to guide your response. For reasoning problems, think step by step. Write a response displayable using LaTeX. Here is the user's question: " +
    textInput;
  const input: ConverseStreamCommandInput = {
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    messages: [
      {
        role: "user",
        content: [
          {
            text: prompt,
          },
          {
            image: {
              // ImageBlock
              format: "png", // required
              source: {
                // ImageSource Union: only one key present
                bytes: imgArray, //new Uint8Array(fs.readFileSync('testImage.png')), // Read and convert the image file
              },
            },
          },
        ],
      },
    ],

    system: [
      {
        text: "System message here",
      },
    ],
    inferenceConfig: {
      maxTokens: 2000,
      temperature: 0.7,
      topP: 0.9,
    },
  };

  try {
    const command = new ConverseStreamCommand(input);
    const response = await client.send(command);

    await processStream(response, onChunk);
  } catch (error) {
    console.error(error);
  }
}

function formatLatexContent(content: string) {
  // Extract preamble commands
  const preambleCommands: string[] = [];
  content = content.replace(/\\usepackage\{[^}]+\}/g, (match) => {
    preambleCommands.push(match);
    return "";
  });

  // Handle \begin{enumerate} and \item
  content = content.replace(/\\begin\{enumerate\}/g, "<ol>");
  content = content.replace(/\\end\{enumerate\}/g, "</ol>");
  content = content.replace(/\\item/g, "</li><li>");

  // Split content into LaTeX math and non-LaTeX parts
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  // Process each part
  const formattedParts = parts.map((part) => {
    if (part.startsWith("$")) {
      // LaTeX math content: leave as is
      return part;
    } else {
      // Non-LaTeX content: escape special characters, except for HTML tags
      return part
        .replace(/([&%$#_{}])/g, "\\$1")
        .replace(/<ol>/g, "\\begin{enumerate}")
        .replace(/<\/ol>/g, "\\end{enumerate}")
        .replace(/<li>/g, "\\item ")
        .replace(/<\/li>/g, "");
    }
  });

  // Combine preamble commands and formatted content
  return {
    preamble: preambleCommands.join("\n"),
    content: formattedParts.join(""),
  };
}

//to test
// textHandler("write me a 150 word fictional backstory about the image in a fanfic fashion")
