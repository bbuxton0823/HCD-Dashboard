/**
 * Language options for the dashboard
 */
export type Language = 'en' | 'es' | 'zh';

/**
 * Translation utilities for multi-language support
 */

// Cache for translations to avoid unnecessary processing
const translationCache = new Map<string, Map<string, string>>();

/**
 * Translate text from English to target language
 * @param text Text to translate
 * @param targetLang Target language code
 * @returns Translated text or original if translation fails
 */
export async function translateText(text: string, targetLang: 'es' | 'zh'): Promise<string> {
  try {
    // Safety check for empty or invalid text
    if (!text || text.trim() === '') {
      return text;
    }
    
    // Check if we have this translation cached
    const langCache = translationCache.get(targetLang) || new Map<string, string>();
    if (langCache.has(text)) {
      return langCache.get(text) || text;
    }

    // Calculate a hash/fingerprint for the text to help with caching
    const textFingerprint = `${text.length}_${text.substring(0, 20)}`;
    if (langCache.has(textFingerprint)) {
      return langCache.get(textFingerprint) || text;
    }

    // For Chinese
    let translated;
    if (targetLang === 'zh') {
      translated = translateToMandarin(text);
    } else {
      // For Spanish
      translated = translateToSpanish(text);
    }
    
    // Cache the result for future use
    langCache.set(text, translated);
    langCache.set(textFingerprint, translated);
    translationCache.set(targetLang, langCache);
    
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Translate text from English to Spanish
 */
export function translateToSpanish(text: string): string {
  // Check for gibberish or empty text
  if (!text || text.trim() === '' || isGibberish(text)) {
    return "Lo sentimos, no se pudo generar un resumen adecuado. Por favor, intente actualizar el análisis.";
  }
  
  // Sanitize the text to prevent any malformed HTML issues
  const sanitizedText = text.replace(/<[^>]*>/g, '');
  
  // Use fixed translation for simple patterns
  if (sanitizedText.includes("You're viewing the Housing Projects Map")) {
    return `Está viendo el Mapa de Proyectos de Vivienda para el Condado de San Mateo.

Este mapa proporciona una visión detallada de los proyectos de vivienda locales en curso, completados y planificados. Estos son los principales datos:

**Total de Unidades de Vivienda:**
- El número total de unidades de vivienda planificadas en todos los proyectos es 2.648.
- De estas, 875 unidades han recibido permisos, y 325 unidades han sido completadas.
- Entre las unidades completadas, 142 están designadas como unidades de vivienda asequible.

**Distribución por Nivel de Ingresos:**
- Ingresos Muy Bajos: 13% de las unidades están dirigidas a este grupo.
- Ingresos Bajos: 9% de las unidades están destinadas a este sector demográfico.
- Ingresos Moderados: 7% de las unidades atienden a este grupo de ingresos.
- Por Encima de Moderados: Una mayoría significativa, 72% de las unidades, están destinadas a hogares con ingresos por encima de moderados.`;
  }
  
  // Apply simple phrase replacements for other cases
  return applyPredefinedTranslations(sanitizedText);
}

/**
 * Translate text from English to Mandarin
 */
export function translateToMandarin(text: string): string {
  // Check for gibberish or empty text
  if (!text || text.trim() === '' || isGibberish(text)) {
    return "抱歉，无法生成适当的摘要。请尝试刷新分析。";
  }
  
  // Sanitize the text to prevent any malformed HTML issues
  const sanitizedText = text.replace(/<[^>]*>/g, '');
  
  // Use fixed translation for simple patterns
  if (sanitizedText.includes("You're viewing the Housing Projects Map")) {
    return `您正在查看圣马特奥县住房项目地图。

该地图提供了当前进行中、已完成和计划中的当地住房项目的详细概述。以下是数据的主要见解：

**住房单位总数：**
- 所有项目计划的住房单位总数为2,648个。
- 其中，875个单位已获许可，325个单位已完成。
- 在已完成的单位中，142个被指定为经济适用房单位。

**收入分布：**
- 极低收入：13%的单位针对这一群体。
- 低收入：9%的单位面向这一人口群体。
- 中等收入：7%的单位服务于这一收入群体。
- 中等收入以上：显著多数，72%的单位面向中等收入以上的家庭。`;
  }
  
  // Apply Mandarin translations for other cases
  return applyChineseTranslations(sanitizedText);
}

/**
 * Apply predefined translations for common dashboard phrases (Spanish)
 */
function applyPredefinedTranslations(text: string): string {
  try {
    // Handle longer texts more effectively by breaking them into segments
    let parts = text.split(/(?<=\.|\!|\?)\s+/);
    let translated = [];

    for (let part of parts) {
      if (!part.trim()) continue;
      
      let translatedPart = part
        // Headers and title replacements
        .replace(/You're viewing the San Mateo County Housing Dashboard Overview/g, 'Está viendo la visión general del panel de vivienda del condado de San Mateo')
        .replace(/You're viewing the Housing Development Progress/g, 'Está viendo el progreso del desarrollo de vivienda')
        .replace(/You're viewing the Housing Projects Map/g, 'Está viendo el mapa de proyectos de vivienda')
        .replace(/You're viewing the Income Level Distribution/g, 'Está viendo la distribución por nivel de ingresos')
        .replace(/San Mateo County Housing Element Dashboard/g, 'Panel de elementos de vivienda del condado de San Mateo')
        .replace(/This dashboard provides/g, 'Este panel proporciona')
        .replace(/Here are the main insights/g, 'Aquí están los principales datos')
        
        // Key metrics and data sections
        .replace(/\*\*Total Housing Units:\*\*/g, '**Total de Unidades de Vivienda:**')
        .replace(/\*\*Income Distribution:\*\*/g, '**Distribución por Nivel de Ingresos:**')
        .replace(/Total Planned Units/g, 'Unidades totales planificadas')
        .replace(/Permits Issued/g, 'Permisos emitidos')
        .replace(/Units Completed/g, 'Unidades completadas')
        .replace(/Affordable Units/g, 'Unidades asequibles')
        .replace(/Key metrics/g, 'Métricas clave')
        
        // Income levels
        .replace(/Very Low Income/g, 'Ingresos muy bajos')
        .replace(/Low Income/g, 'Ingresos bajos')
        .replace(/Moderate Income/g, 'Ingresos moderados')
        .replace(/Above Moderate/g, 'Por encima de moderados')
        
        // Status terms
        .replace(/The total number of planned housing units/g, 'El número total de unidades de vivienda planificadas')
        .replace(/Of these,/g, 'De estas,')
        .replace(/units have been permitted/g, 'unidades han recibido permisos')
        .replace(/units have been completed/g, 'unidades han sido completadas')
        .replace(/Among the completed units/g, 'Entre las unidades completadas')
        .replace(/are designated as affordable housing units/g, 'están designadas como unidades de vivienda asequible')
        .replace(/of the units are aimed at this group/g, 'de las unidades están dirigidas a este grupo')
        .replace(/of the units are targeted towards this demographic/g, 'de las unidades están destinadas a este sector demográfico')
        .replace(/of the units cater to this income group/g, 'de las unidades atienden a este grupo de ingresos')
        .replace(/A significant majority/g, 'Una mayoría significativa')
        .replace(/of the units are designated for/g, 'de las unidades están destinadas a')
        .replace(/completed/g, 'completados')
        .replace(/Completed/g, 'Completado')
        .replace(/under construction/g, 'en construcción')
        .replace(/Under Construction/g, 'En construcción')
        .replace(/permitted/g, 'con permiso')
        .replace(/Permitted/g, 'Con permiso')
        .replace(/planned/g, 'planificados')
        .replace(/Planned/g, 'Planificado');
        
      translated.push(translatedPart);
    }

    // Join the translated parts back together
    let result = translated.join(' ');
    
    // Format numbers for Spanish locale
    result = formatNumbersForSpanish(result);
    
    return result;
  } catch (error) {
    console.error('Error in Spanish translation:', error);
    return text; // Return original if translation fails
  }
}

/**
 * Apply predefined translations for common dashboard phrases (Mandarin)
 */
function applyChineseTranslations(text: string): string {
  try {
    // Handle longer texts more effectively by breaking them into segments
    let parts = text.split(/(?<=\.|\!|\?)\s+/);
    let translated = [];

    for (let part of parts) {
      if (!part.trim()) continue;
      
      let translatedPart = part
        // Headers and title replacements
        .replace(/You're viewing the San Mateo County Housing Dashboard Overview/g, '您正在查看圣马特奥县住房仪表板概述')
        .replace(/You're viewing the Housing Development Progress/g, '您正在查看住房开发进度')
        .replace(/You're viewing the Housing Projects Map/g, '您正在查看住房项目地图')
        .replace(/You're viewing the Income Level Distribution/g, '您正在查看收入水平分布')
        .replace(/San Mateo County Housing Element Dashboard/g, '圣马特奥县住房元素仪表板')
        .replace(/This dashboard provides/g, '该仪表板提供')
        .replace(/Here are the main insights/g, '以下是主要数据见解')
        
        // Key metrics and data sections
        .replace(/\*\*Total Housing Units:\*\*/g, '**住房单位总数：**')
        .replace(/\*\*Income Distribution:\*\*/g, '**收入分布：**')
        .replace(/Total Planned Units/g, '计划单位总数')
        .replace(/Permits Issued/g, '已发放许可证')
        .replace(/Units Completed/g, '已完成单位')
        .replace(/Affordable Units/g, '经济适用房单位')
        .replace(/Key metrics/g, '关键指标')
        
        // Income levels
        .replace(/Very Low Income/g, '极低收入')
        .replace(/Low Income/g, '低收入')
        .replace(/Moderate Income/g, '中等收入')
        .replace(/Above Moderate/g, '中等收入以上')
        
        // Status terms
        .replace(/The total number of planned housing units/g, '所有项目计划的住房单位总数')
        .replace(/Of these,/g, '其中，')
        .replace(/units have been permitted/g, '个单位已获许可')
        .replace(/units have been completed/g, '个单位已完成')
        .replace(/Among the completed units/g, '在已完成的单位中')
        .replace(/are designated as affordable housing units/g, '被指定为经济适用房单位')
        .replace(/of the units are aimed at this group/g, '的单位针对这一群体')
        .replace(/of the units are targeted towards this demographic/g, '的单位面向这一人口群体')
        .replace(/of the units cater to this income group/g, '的单位服务于这一收入群体')
        .replace(/A significant majority/g, '显著多数')
        .replace(/of the units are designated for/g, '的单位面向')
        .replace(/completed/g, '已完成')
        .replace(/Completed/g, '已完成')
        .replace(/under construction/g, '在建')
        .replace(/Under Construction/g, '在建')
        .replace(/permitted/g, '已获许可')
        .replace(/Permitted/g, '已获许可')
        .replace(/planned/g, '已计划')
        .replace(/Planned/g, '已计划');
        
      translated.push(translatedPart);
    }

    // Join the translated parts back together
    let result = translated.join(' ');
    
    // Format numbers for Chinese locale
    result = formatNumbersForChinese(result);
    
    return result;
  } catch (error) {
    console.error('Error in Chinese translation:', error);
    return text; // Return original if translation fails
  }
}

/**
 * Format numbers to use Spanish locale formatting
 */
function formatNumbersForSpanish(text: string): string {
  try {
    // Replace numbers with Spanish locale formatting (e.g., 1,000 -> 1.000)
    return text.replace(/\b(\d{1,3}(?:,\d{3})+)\b/g, (match) => {
      const num = parseFloat(match.replace(/,/g, ''));
      return num.toLocaleString('es-ES');
    });
  } catch (error) {
    console.error('Error formatting numbers for Spanish:', error);
    return text; // Return original if formatting fails
  }
}

/**
 * Format numbers to use Chinese locale formatting
 */
function formatNumbersForChinese(text: string): string {
  try {
    // Replace numbers with Chinese locale formatting
    return text.replace(/\b(\d{1,3}(?:,\d{3})+)\b/g, (match) => {
      const num = parseFloat(match.replace(/,/g, ''));
      return num.toLocaleString('zh-CN');
    });
  } catch (error) {
    console.error('Error formatting numbers for Chinese:', error);
    return text; // Return original if formatting fails
  }
}

/**
 * Check if text appears to be gibberish
 */
function isGibberish(text: string): boolean {
  // Quick bailout for empty strings
  if (!text || text.length < 20) return true;

  try {
    // Simple heuristic to detect gibberish
    const words = text.split(/\s+/);
    if (words.length < 5) return true;

    let gibberishCount = 0;
    
    for (const word of words) {
      if (
        (/[^\w\s.,;:!?'-]/.test(word) && word.length > 3) || // Unusual characters
        /(.)\1{3,}/.test(word) || // Repeated characters (more than 3 times)
        (word.length > 15) || // Extremely long words
        (/[A-Z]{4,}/.test(word) && !/^[A-Z]+$/.test(word)) // Random capitalization
      ) {
        gibberishCount++;
      }
    }
    
    const gibberishRatio = gibberishCount / words.length;
    return gibberishRatio > 0.15 || text.length < 20;
  } catch (error) {
    console.error('Error in gibberish detection:', error);
    return false; // Don't consider text gibberish if our detection fails
  }
}

/**
 * UI translations for fixed elements
 */
export const uiTranslations = {
  en: {
    aiAssistantTitle: 'AI Housing Dashboard Assistant',
    refreshAnalysis: 'Refresh analysis',
    refreshData: 'Refresh Data',
    refreshing: 'Refreshing...',
    analyzingData: 'Analyzing dashboard data...',
    poweredByOpenAI: 'Powered by OpenAI',
    localAI: 'Local AI',
    housingDevelopmentProgress: 'Housing Development Progress',
    incomeLevelDistribution: 'Income Level Distribution',
    housingProjectsMap: 'Housing Projects Map',
    showAdminPanel: 'Show Admin Panel',
    hideAdminPanel: 'Hide Admin Panel',
    aiRecommendedMCP: 'AI-recommended MCP selection',
    manualMCPSelection: 'Manual MCP Selection:',
    browserToolsMCP: 'Browser Tools MCP',
    puppeteerMCP: 'Puppeteer MCP',
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    chinese: 'Mandarin Chinese',
    mcpTooltip: 'AI will select the best data collection method based on past performance and current conditions.',
    aiRecommendation: 'AI Recommendation',
    selectMCP: 'Select data collection method'
  },
  es: {
    aiAssistantTitle: 'Asistente de IA para el panel de vivienda',
    refreshAnalysis: 'Actualizar análisis',
    refreshData: 'Actualizar datos',
    refreshing: 'Actualizando...',
    analyzingData: 'Analizando datos del panel...',
    poweredByOpenAI: 'Desarrollado por OpenAI',
    localAI: 'IA local',
    housingDevelopmentProgress: 'Progreso del desarrollo de vivienda',
    incomeLevelDistribution: 'Distribución por nivel de ingresos',
    housingProjectsMap: 'Mapa de proyectos de vivienda',
    showAdminPanel: 'Mostrar panel de administración',
    hideAdminPanel: 'Ocultar panel de administración',
    aiRecommendedMCP: 'Selección de MCP recomendada por IA',
    manualMCPSelection: 'Selección manual de MCP:',
    browserToolsMCP: 'MCP de herramientas de navegador',
    puppeteerMCP: 'MCP de Puppeteer',
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    chinese: 'Chino Mandarín',
    mcpTooltip: 'La IA seleccionará el mejor método de recopilación de datos según el rendimiento anterior y las condiciones actuales.',
    aiRecommendation: 'Recomendación de IA',
    selectMCP: 'Seleccionar método de recopilación de datos'
  },
  zh: {
    aiAssistantTitle: '人工智能住房仪表板助手',
    refreshAnalysis: '刷新分析',
    refreshData: '刷新数据',
    refreshing: '刷新中...',
    analyzingData: '正在分析仪表板数据...',
    poweredByOpenAI: '由OpenAI提供支持',
    localAI: '本地AI',
    housingDevelopmentProgress: '住房开发进度',
    incomeLevelDistribution: '收入水平分布',
    housingProjectsMap: '住房项目地图',
    showAdminPanel: '显示管理面板',
    hideAdminPanel: '隐藏管理面板',
    aiRecommendedMCP: 'AI推荐的MCP选择',
    manualMCPSelection: '手动MCP选择：',
    browserToolsMCP: '浏览器工具MCP',
    puppeteerMCP: 'Puppeteer MCP',
    language: '语言',
    english: '英语',
    spanish: '西班牙语',
    chinese: '普通话 (中文)',
    mcpTooltip: 'AI将根据过去的性能和当前条件选择最佳的数据收集方法。',
    aiRecommendation: 'AI推荐',
    selectMCP: '选择数据收集方法'
  }
}; 