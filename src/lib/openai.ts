import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // Only allow server-side usage
});

/**
 * Generate AI-powered dashboard summary using OpenAI
 */
export async function generateDashboardSummary(dashboardData: any, currentView: string): Promise<string> {
  try {
    // Server-side check to prevent browser usage
    if (typeof window !== 'undefined') {
      throw new Error('OpenAI API can only be used server-side');
    }

    // Create a prompt for the current dashboard view
    const prompt = createPromptForDashboardView(dashboardData, currentView);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in explaining housing dashboard data. 
                   Your task is to generate clear, concise, and professional explanations of housing data.
                   
                   IMPORTANT GUIDELINES:
                   1. Always provide factual, coherent explanations based only on the provided data.
                   2. Use proper English with correct grammar and syntax.
                   3. Focus on key insights and important trends the data reveals.
                   4. Use simple language to explain complex housing metrics.
                   5. Structure your response with short paragraphs.
                   6. NEVER generate random text, gibberish, or hallucinated data.
                   7. If you cannot provide a proper response, say "Unable to analyze the data" rather than generating nonsense.
                   8. Always address the user directly in second person ("You're viewing").
                   9. Keep responses between 100-200 words for clarity.
                   10. ALWAYS conclude with a section titled "**Key Numerical Data:**" that lists important numbers from the data as bullet points.
                   
                   The user is viewing a housing dashboard for San Mateo County. Your goal is to help them understand what they're seeing.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5, // Lower temperature for more predictable outputs
      max_tokens: 350,
      presence_penalty: 0.1,
      frequency_penalty: 0.5 // Reduce repetition
    });

    // Extract and validate the response
    const generatedText = response.choices[0]?.message?.content || 'Unable to generate summary.';
    
    // Additional validation to prevent gibberish (simple check)
    if (generatedText.length < 20 || /[^\w\s.,;:!?'-]{10,}/.test(generatedText)) {
      return "I'm sorry, I couldn't generate a proper summary of this dashboard view. Please try refreshing the analysis.";
    }
    
    return generatedText;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate AI summary');
  }
}

/**
 * Create appropriate prompt based on dashboard view and data
 */
function createPromptForDashboardView(data: any, view: string): string {
  const { summaryStats, incomeDistribution, progressChart, housingProjects } = data;
  
  // Create a condensed version of data to avoid token limits
  const condensedData = {
    summaryStats,
    incomeDistribution: incomeDistribution.map((item: any) => ({ 
      category: item.category, 
      value: Math.round(item.value) 
    })),
    progressChart: progressChart.map((item: any) => ({
      category: item.category,
      completed: item.completed,
      underConstruction: item.underConstruction,
      permitted: item.permitted,
      planned: item.planned
    })),
    projectCount: housingProjects.length,
    projectStatuses: {
      completed: housingProjects.filter((p: any) => p.status === 'Completed').length,
      inProgress: housingProjects.filter((p: any) => 
        p.status === 'Under Construction' || p.status === 'Permitted'
      ).length,
      planned: housingProjects.filter((p: any) => p.status === 'Planned').length
    }
  };
  
  // Create view-specific prompts
  switch (view) {
    case 'overview':
      return `Explain the San Mateo County Housing Dashboard Overview to the user. 
              Begin with "You're viewing the San Mateo County Housing Dashboard Overview."
              Highlight these key metrics: 
              - Total Planned Units: ${summaryStats.totalPlannedUnits.toLocaleString()}
              - Permits Issued: ${summaryStats.permitedUnits.toLocaleString()}
              - Units Completed: ${summaryStats.completedUnits.toLocaleString()} 
              - Affordable Units: ${summaryStats.affordableUnits.toLocaleString()}
              
              Include the income distribution: Above Moderate (${Math.round(incomeDistribution[3].value)}%), 
              Very Low (${Math.round(incomeDistribution[0].value)}%), 
              Low (${Math.round(incomeDistribution[1].value)}%), and 
              Moderate (${Math.round(incomeDistribution[2].value)}%).
              
              Write 2-3 short paragraphs total.
              
              End with a section titled "**Key Numerical Data:**" that lists all important numbers as bullet points.`;
      
    case 'progress':
      return `Explain the Housing Development Progress chart for San Mateo County.
              Begin with "You're viewing the Housing Development Progress for San Mateo County."
              This chart shows housing progress across different income categories.
              
              Include these specific metrics:
              - Very Low Income: ${progressChart[0].completed} completed, ${progressChart[0].underConstruction} under construction, ${progressChart[0].permitted} permitted, ${progressChart[0].planned} planned
              - Low Income: ${progressChart[1].completed} completed, ${progressChart[1].underConstruction} under construction, ${progressChart[1].permitted} permitted, ${progressChart[1].planned} planned
              - Moderate Income: ${progressChart[2].completed} completed, ${progressChart[2].underConstruction} under construction, ${progressChart[2].permitted} permitted, ${progressChart[2].planned} planned
              - Above Moderate: ${progressChart[3].completed} completed, ${progressChart[3].underConstruction} under construction, ${progressChart[3].permitted} permitted, ${progressChart[3].planned} planned
              
              Calculate the total completion rate and mention which income category has made the most progress.
              Write 2-3 short paragraphs total.
              
              End with a section titled "**Key Numerical Data:**" that lists all important numbers as bullet points.`;
      
    case 'map':
      return `Explain the Housing Projects Map for San Mateo County.
              Begin with "You're viewing the Housing Projects Map for San Mateo County."
              
              Include these specific metrics:
              - Total projects: ${housingProjects.length}
              - Completed projects: ${housingProjects.filter((p: any) => p.status === 'Completed').length}
              - In-progress projects: ${housingProjects.filter((p: any) => p.status === 'Under Construction' || p.status === 'Permitted').length}
              - Planned projects: ${housingProjects.filter((p: any) => p.status === 'Planned').length}
              
              Explain that each marker represents a project and users can click them for details.
              Briefly mention the geographic distribution pattern if apparent.
              Write 2-3 short paragraphs total.
              
              End with a section titled "**Key Numerical Data:**" that lists all important numbers as bullet points.`;
      
    case 'income':
      return `Explain the Income Level Distribution chart for San Mateo County housing.
              Begin with "You're viewing the Income Level Distribution for San Mateo County housing."
              
              Include these specific percentages:
              - Above Moderate Income: ${Math.round(incomeDistribution[3].value)}%
              - Moderate Income: ${Math.round(incomeDistribution[2].value)}%
              - Low Income: ${Math.round(incomeDistribution[1].value)}%
              - Very Low Income: ${Math.round(incomeDistribution[0].value)}%
              
              Comment on the balance (or imbalance) between different income categories.
              Mention implications for housing affordability in the county.
              Write 2-3 short paragraphs total.
              
              End with a section titled "**Key Numerical Data:**" that lists all important numbers as bullet points.`;
      
    default:
      return `Provide a general overview of the San Mateo County Housing Dashboard.
              Begin with "You're viewing the San Mateo County Housing Element Dashboard."
              
              Include these key metrics:
              - Total planned units: ${summaryStats.totalPlannedUnits.toLocaleString()}
              - Permits issued: ${summaryStats.permitedUnits.toLocaleString()}
              - Units completed: ${summaryStats.completedUnits.toLocaleString()}
              - Affordable units: ${summaryStats.affordableUnits.toLocaleString()}
              
              Briefly explain that the dashboard shows housing development data for San Mateo County.
              Mention that it includes visualizations for progress by income category, geographic distribution, and affordability breakdown.
              Write 2-3 short paragraphs total.
              
              End with a section titled "**Key Numerical Data:**" that lists all important numbers as bullet points.`;
  }
} 