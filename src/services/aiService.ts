export async function analyzeCivicIssue(imageDescription: string, base64Image?: string) {
  try {
    const response = await fetch("/api/analyze-issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageDescription, base64Image }),
    });

    if (!response.ok) {
      throw new Error(`API analysis failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Client AI Analysis failed:", error);
    return null;
  }
}

