using Teleprompt.Domain.Parsing;

namespace Teleprompt.Tests;

public class ParserTests
{
    [Fact]
    public void Divide_em_cenas_com_tempo()
    {
        var scenes = ScriptParser.Parse("Cena 01\n[Locução]: Primeira\n\nCena 02\n[Locução]: Segunda");

        Assert.Equal(2, scenes.Count);
        Assert.Equal("01", scenes[0].SceneNumber);
        Assert.Equal("Primeira", scenes[0].SpokenText);
        Assert.Equal("Segunda", scenes[1].SpokenText);
    }

    [Fact]
    public void Extrai_metadados_e_remove_do_spoken_text()
    {
        var scenes = ScriptParser.Parse("""
            Cena 1
            Tempo: 30 segundos
            [Abe]: Abertura legal
            [Let1]: Titulo na tela
            [Pron1]: wa-ter
            [Img1]: https://exemplo.com/img.png
            [Url1]: https://exemplo.com/fonte
            [Locução]: Fala do apresentador
            [Enc]: Encerramento
            """);

        var scene = scenes[0];
        Assert.Equal("30 segundos", scene.Time);
        Assert.Equal("Abertura legal", scene.Opening);
        Assert.Equal("Encerramento", scene.Closing);
        Assert.Equal("Titulo na tela", scene.Lettering);
        Assert.Equal("wa-ter", scene.Pronunciation);
        Assert.Equal("https://exemplo.com/img.png", scene.ImageUrl);
        Assert.Equal("https://exemplo.com/fonte", scene.SourceUrl);
        Assert.Equal("Fala do apresentador", scene.SpokenText);
    }

    [Fact]
    public void Multiplos_let_pron_ficam_em_ordem()
    {
        var scenes = ScriptParser.Parse("""
            Cena 1
            [pron1]: wa-ter
            [pron2]: pro-nun-ci-a-tion
            [Let1]: Primeiro
            [Let2]: Segundo
            [Locução]: Hello world
            """);

        Assert.Equal("Hello world", scenes[0].SpokenText);
        Assert.Equal("wa-ter\npro-nun-ci-a-tion", scenes[0].Pronunciation);
        Assert.Equal("Primeiro\nSegundo", scenes[0].Lettering);
    }

    [Fact]
    public void Remove_prefixo_locucao_mas_mantem_o_resto()
    {
        var scenes = ScriptParser.Parse("Cena 1\n[Locução]: Olá, tudo bem? Vamos começar!");
        Assert.Equal("Olá, tudo bem? Vamos começar!", scenes[0].SpokenText);
    }

    [Fact]
    public void Sem_marcador_cria_uma_cena_1()
    {
        var scenes = ScriptParser.Parse("Somente um texto sem marcador");
        Assert.Single(scenes);
        Assert.Equal("1", scenes[0].SceneNumber);
        Assert.Equal("Somente um texto sem marcador", scenes[0].SpokenText);
    }

    [Fact]
    public void Autosplit_de_paragrafos_com_4_mais()
    {
        var scenes = ScriptParser.Parse("p1\np2\np3\np4\np5\np6");
        Assert.Equal(3, scenes.Count);
        Assert.Equal("p1\np2", scenes[0].SpokenText);
        Assert.Equal("p3\np4", scenes[1].SpokenText);
        Assert.Equal("p5\np6", scenes[2].SpokenText);
    }

    [Fact]
    public void Normaliza_CRLF_e_nonbreaking_space()
    {
        var scenes = ScriptParser.Parse("Cena 1\r\n[Locução]: Olá\u00A0mundo");
        Assert.Equal("Olá mundo", scenes[0].SpokenText);
    }

    [Fact]
    public void StripHtml_remove_tags_e_entidades()
    {
        Assert.Equal("Olá & \"mundo\"", ScriptParser.StripHtml("<p>Olá &amp; &quot;mundo&quot;</p>"));
    }
}
