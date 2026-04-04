/**
 * Default report templates for TI-RADS output.
 * Three formats: PowerScribe 360, PowerScribe 1, RadAI Omni.
 */

export const tiradsTemplates = {
  ps360: {
    label: 'PowerScribe 360',
    template: `THYROID NODULE ASSESSMENT (ACR TI-RADS)

{{#if noduleLocationProvided}}Location: {{noduleLocation}}
{{/if}}{{#if noduleSizeProvided}}Size: {{noduleSize}} cm (maximum dimension)
{{/if}}
Composition: {{composition}} ({{compositionPoints}} pts)
Echogenicity: {{echogenicity}} ({{echogenicityPoints}} pts)
Shape: {{shape}} ({{shapePoints}} pts)
Margin: {{margin}} ({{marginPoints}} pts)
Echogenic Foci: {{echogenicFoci}} ({{echogenicFociPoints}} pts)

Total Score: {{totalScore}} points
TI-RADS Level: {{tiradsFullLabel}}

RECOMMENDATION:
{{recommendation}}
{{recommendationDetail}}
{{#if additionalFindingsProvided}}
ADDITIONAL FINDINGS:
{{additionalFindings}}
{{/if}}`,
  },

  ps1: {
    label: 'PowerScribe One',
    template: `{{#if noduleLocationProvided}}{{noduleLocation}} thyroid nodule{{/if}}{{#if noduleSizeProvided}} measuring {{noduleSize}} cm{{/if}}. Composition is {{composition}}. Echogenicity is {{echogenicity}}. Shape is {{shape}}. Margin is {{margin}}. Echogenic foci: {{echogenicFoci}}. ACR TI-RADS score {{totalScore}} ({{tiradsFullLabel}}). {{recommendation}}.{{#if additionalFindingsProvided}} {{additionalFindings}}{{/if}}`,
  },

  radai: {
    label: 'RadAI Omni',
    template: `[STRUCTURED REPORT - ACR TI-RADS]
{{#if noduleLocationProvided}}Location: {{noduleLocation}}
{{/if}}{{#if noduleSizeProvided}}Size_cm: {{noduleSize}}
{{/if}}Composition: {{composition}} | Points: {{compositionPoints}}
Echogenicity: {{echogenicity}} | Points: {{echogenicityPoints}}
Shape: {{shape}} | Points: {{shapePoints}}
Margin: {{margin}} | Points: {{marginPoints}}
Echogenic_Foci: {{echogenicFoci}} | Points: {{echogenicFociPoints}}
Total_Score: {{totalScore}}
TI-RADS_Level: {{tiradsName}}
TI-RADS_Category: {{tiradsLabel}}
Recommendation: {{recommendation}}
{{#if additionalFindingsProvided}}Additional_Findings: {{additionalFindings}}
{{/if}}[END STRUCTURED REPORT]`,
  },
};
