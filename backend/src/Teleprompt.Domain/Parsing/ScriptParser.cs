using System.Text.RegularExpressions;

namespace Teleprompt.Domain.Parsing;

public class Scene
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string SceneNumber { get; set; } = string.Empty;
    public string? Time { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> Images { get; set; } = new();
    public string? SourceUrl { get; set; }
    public List<string> Sources { get; set; } = new();
    public string? Lettering { get; set; }
    public string? Opening { get; set; }
    public string? Closing { get; set; }
    public string? Observation { get; set; }
    public string? Description { get; set; }
    public string? OnScreenText { get; set; }
    public string? SpokenText { get; set; }
    public string? Pronunciation { get; set; }
}

public static class ScriptParser
{
    private static readonly Regex HtmlBr = new(@"<br\s*/?>", RegexOptions.IgnoreCase);
    private static readonly Regex HtmlBlockClose = new(@"</(div|p)>", RegexOptions.IgnoreCase);
    private static readonly Regex HtmlBlockOpen = new(@"<(div|p)[^>]*>", RegexOptions.IgnoreCase);
    private static readonly Regex HtmlAny = new(@"<[^>]*>", RegexOptions.IgnoreCase);
    private static readonly Regex ImgTag = new(@"^\s*\[img(\d+)\]\s*[:\-]\s*(https?://\S+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex UrlTag = new(@"^\s*\[url(\d+)\]\s*[:\-]\s*(https?://\S+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex LetTag = new(@"^\s*\[let(\d+)\]\s*[:\-]\s*(.+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex PronTag = new(@"^\s*\[pron(\d+)\]\s*[:\-]\s*(.+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex AbeTag = new(@"^\s*\[abe\]\s*[:\-]\s*(.+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex EncTag = new(@"^\s*\[enc\]\s*[:\-]\s*(.+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex TempoTag = new(@"^\s*(?:Tempo|Duração)\s*[:\-]\s*(.+)", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex LocLegendaTag = new(@"^\s*\[?(?:Locução|Legenda)\]?\s*[:\-]\s*", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    private static readonly Regex SceneSplit = new(@"(?:^|\n)\s*Cena(?:\s*:?\s*|(?=[0-9]))(?:\[)?([0-9]+(?:-[a-zA-Z0-9]+)*)(?:\])?\s*", RegexOptions.IgnoreCase);
    private static readonly Regex BlankLine = new(@"\n\s*\n");

    public static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return string.Empty;

        var text = HtmlBr.Replace(html, "\n");
        text = HtmlBlockClose.Replace(text, "\n");
        text = HtmlBlockOpen.Replace(text, "");
        text = HtmlAny.Replace(text, "");
        text = text.Replace("&nbsp;", " ")
            .Replace("&amp;", "&")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">")
            .Replace("&quot;", "\"")
            .Replace("&#39;", "'");
        text = Regex.Replace(text, @"\n{3,}", "\n\n");
        text = Regex.Replace(text, @"[ \t]+", " ");
        var lines = text.Split('\n').Select(l => l.Trim());
        return string.Join("\n", lines).Trim();
    }

    private static string Normalize(string text)
    {
        return text.Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Replace('\u00A0', ' ')
            .Replace("\u2028", " ")
            .Replace("\u2029", " ")
            .Replace("\ufeff", " ");
    }

    private static List<string> SplitParagraphs(string text)
    {
        var byBlank = BlankLine.Split(text)
            .Select(p => p.Trim())
            .Where(p => p.Length > 0)
            .ToList();

        if (byBlank.Count > 1) return byBlank;

        return text.Split('\n')
            .Select(p => p.Trim())
            .Where(p => p.Length > 0)
            .ToList();
    }

    private record SceneData(
        List<string> Images, List<string> Sources, List<string> Lettering,
        List<string> Pronunciation, string? Opening, string? Closing,
        string? Time, string SpokenText);

    private static SceneData ExtractSceneData(string content)
    {
        var images = new List<string>();
        var sources = new List<string>();
        var lettering = new List<string>();
        var pronunciation = new List<string>();

        foreach (Match m in ImgTag.Matches(content))
        {
            var idx = int.Parse(m.Groups[1].Value) - 1;
            while (images.Count <= idx) images.Add("");
            if (string.IsNullOrEmpty(images[idx])) images[idx] = m.Groups[2].Value.Trim();
        }

        foreach (Match m in UrlTag.Matches(content))
        {
            var idx = int.Parse(m.Groups[1].Value) - 1;
            while (sources.Count <= idx) sources.Add("");
            if (string.IsNullOrEmpty(sources[idx])) sources[idx] = m.Groups[2].Value.Trim();
        }

        foreach (Match m in LetTag.Matches(content))
        {
            var idx = int.Parse(m.Groups[1].Value) - 1;
            while (lettering.Count <= idx) lettering.Add("");
            var val = m.Groups[2].Value.Trim();
            if (string.IsNullOrEmpty(lettering[idx]))
                lettering[idx] = val.Contains('<') ? StripHtml(val) : val;
        }

        foreach (Match m in PronTag.Matches(content))
        {
            var idx = int.Parse(m.Groups[1].Value) - 1;
            while (pronunciation.Count <= idx) pronunciation.Add("");
            var val = m.Groups[2].Value.Trim();
            if (string.IsNullOrEmpty(pronunciation[idx]))
                pronunciation[idx] = val.Contains('<') ? StripHtml(val) : val;
        }

        var opening = MatchValue(content, AbeTag);
        var closing = MatchValue(content, EncTag);
        var time = MatchValue(content, TempoTag);

        if (opening?.Contains('<') == true) opening = StripHtml(opening);
        if (closing?.Contains('<') == true) closing = StripHtml(closing);

        var spokenRaw = content;
        spokenRaw = Regex.Replace(spokenRaw, @"^\s*\[(?:img|url|let|pron)\d+\]\s*[:\-]\s*.+", "", RegexOptions.Multiline | RegexOptions.IgnoreCase);
        spokenRaw = Regex.Replace(spokenRaw, @"^\s*\[(?:abe|enc)\]\s*[:\-]\s*.+", "", RegexOptions.Multiline | RegexOptions.IgnoreCase);
        spokenRaw = Regex.Replace(spokenRaw, @"^\s*(?:Tempo|Duração)\s*[:\-]\s*.+", "", RegexOptions.Multiline | RegexOptions.IgnoreCase);
        spokenRaw = LocLegendaTag.Replace(spokenRaw, "");
        spokenRaw = Regex.Replace(spokenRaw, @"^\s*[\r\n]", "", RegexOptions.Multiline);
        spokenRaw = spokenRaw.Trim();

        var spoken = spokenRaw.Contains('<') ? StripHtml(spokenRaw) : spokenRaw;

        return new SceneData(images, sources, lettering, pronunciation, opening, closing, time, spoken);
    }

    private static string? MatchValue(string content, Regex pattern)
    {
        var m = pattern.Match(content);
        return m.Success ? m.Groups[1].Value.Trim() : null;
    }

    public static List<Scene> Parse(string text, int paragraphsPerScene = 0)
    {
        var normalized = Normalize(text);
        var scenes = new List<Scene>();

        var parts = SceneSplit.Split(normalized);

        // parts[0] é o texto anterior à primeira "Cena"; pares 1,3,5... são números, 2,4,6... conteúdos
        for (var i = 1; i + 1 < parts.Length; i += 2)
        {
            var sceneNumber = string.IsNullOrWhiteSpace(parts[i])
                ? (i / 2 + 1).ToString()
                : parts[i].Trim();
            var rawContent = parts[i + 1] ?? "";

            var data = ExtractSceneData(rawContent);
            scenes.Add(BuildScene(sceneNumber, data));
        }

        // Caso de segurança: texto sem tag "Cena"
        if (scenes.Count == 0 && normalized.Trim().Length > 0)
        {
            var paragraphs = SplitParagraphs(normalized);
            var autoSplit = paragraphsPerScene == 0 && paragraphs.Count >= 4;
            if (paragraphsPerScene > 0 || autoSplit)
            {
                var n = autoSplit ? 2 : paragraphsPerScene;
                var groups = new List<string>();
                for (var i = 0; i < paragraphs.Count; i += n)
                {
                    groups.Add(string.Join("\n\n", paragraphs.Skip(i).Take(n)));
                }
                for (var g = 0; g < groups.Count; g++)
                {
                    scenes.Add(BuildScene((g + 1).ToString(), ExtractSceneData(groups[g])));
                }
            }
            else
            {
                scenes.Add(BuildScene("1", ExtractSceneData(normalized)));
            }
        }

        return scenes;
    }

    private static Scene BuildScene(string sceneNumber, SceneData data)
    {
        return new Scene
        {
            SceneNumber = sceneNumber,
            Time = data.Time,
            ImageUrl = data.Images.Count > 0 ? data.Images[0] : null,
            Images = data.Images.Skip(1).ToList(),
            SourceUrl = data.Sources.Count > 0 ? data.Sources[0] : null,
            Sources = data.Sources.Skip(1).ToList(),
            Lettering = data.Lettering.Count > 0 ? string.Join('\n', data.Lettering) : null,
            Pronunciation = data.Pronunciation.Count > 0 ? string.Join('\n', data.Pronunciation) : null,
            Opening = data.Opening,
            Closing = data.Closing,
            SpokenText = string.IsNullOrEmpty(data.SpokenText) ? null : data.SpokenText,
            Description = null,
            OnScreenText = null
        };
    }
}
