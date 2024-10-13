import OpenAI from "openai";
import { deLatexer } from "./aws";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

export async function ttsHandler(
  inputString: string = "i love yuchen yet he call's me handsone!"
) {
  const processInputString: string | undefined = await deLatexer(inputString);

  if (!processInputString) {
    throw new Error("dingus dongus");
  }

  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: processInputString,
  });

  console.log(mp3);
  return mp3.arrayBuffer();
}
