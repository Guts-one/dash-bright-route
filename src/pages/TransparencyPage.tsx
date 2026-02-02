import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, Clock, Fuel, Wrench, Package, Shield, Eye, UserCheck, 
  ArrowLeft, CheckCircle, XCircle, Truck 
} from 'lucide-react';

export default function TransparencyPage() {
  const trackedItems = [
    {
      icon: MapPin,
      title: 'Localizacao em tempo real',
      purpose: 'ETAs precisos e comunicacao com clientes',
      description: 'Monitoramos a localizacao dos caminhoes durante o horario de trabalho para oferecer janelas de entrega precisas aos clientes e ajudar a equipe de despacho a otimizar rotas.',
      notUsedFor: 'Vigilancia pessoal ou monitoramento fora do horario',
    },
    {
      icon: Clock,
      title: 'Rota e tempos de parada',
      purpose: 'Eficiencia operacional e seguranca',
      description: 'Duracoes de parada ajudam a identificar atrasos em docas, problemas de transito e garantir pausas adequadas para seguranca e conformidade.',
      notUsedFor: 'Microgestao ou medidas punitivas',
    },
    {
      icon: Fuel,
      title: 'Combustivel e quilometragem',
      purpose: 'Gestao de custos e planejamento de manutencao',
      description: 'Dados agregados de combustivel ajudam a empresa a controlar custos e planejar manutencao. Padroes individuais de conducao nao sao analisados.',
      notUsedFor: 'Pontuacao individual de desempenho do motorista',
    },
    {
      icon: Wrench,
      title: 'Alertas de manutencao',
      purpose: 'Seguranca e longevidade dos veiculos',
      description: 'Alertas automatizados garantem manutencao no tempo certo, mantendo motoristas seguros e evitando panes.',
      notUsedFor: 'Culpar motorista por problemas de manutencao',
    },
    {
      icon: Package,
      title: 'Comprovante de entrega',
      purpose: 'Responsabilidade do cliente e protecao ao motorista',
      description: 'Assinaturas digitais e relatos de problemas protegem motoristas e empresa em caso de disputas.',
      notUsedFor: 'Metas de velocidade ou eficiencia',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FleetTrack Pro</span>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/auth">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o login
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Transparencia em primeiro lugar</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">O que monitoramos e por que</h1>
          <p className="text-lg text-muted-foreground">
            FleetTrack Pro foi criado para excelencia operacional, nao para vigilancia.
            Acreditamos em transparencia total sobre quais dados sao coletados e como sao usados
            para apoiar o sucesso da equipe.
          </p>
        </div>
      </section>

      {/* Data Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {trackedItems.map((item) => (
              <Card key={item.title} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="text-sm text-accent">{item.purpose}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-destructive">Nao usado para:</p>
                      <p className="text-xs text-muted-foreground">{item.notUsedFor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Nossos compromissos</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Apenas horario de trabalho</h3>
                    <p className="text-sm text-muted-foreground">
                      O monitoramento fica ativo apenas durante o horario de trabalho.
                      O tempo fora de servico e privado e nunca e monitorado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Minimizacao de dados</h3>
                    <p className="text-sm text-muted-foreground">
                      Coletamos apenas o necessario para operacoes.
                      Sem cameras, sem gravacao de audio, sem rastreamento de dispositivos pessoais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Relatorios agregados</h3>
                    <p className="text-sm text-muted-foreground">
                      Relatorios focam em tendencias da frota, nao em rankings individuais.
                      Os dados apoiam a equipe, nao a competicao.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Acesso do motorista</h3>
                    <p className="text-sm text-muted-foreground">
                      Motoristas podem ver seus proprios dados a qualquer momento.
                      Transparencia total significa que voce sempre sabe o que sabemos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Politica de retencao de dados</h2>
          <p className="text-muted-foreground mb-6">
            Dados de GPS e rota sao mantidos por <strong>90 dias</strong> para operacao,
            depois sao apagados automaticamente. Registros de entrega sao mantidos por
            <strong> 2 anos</strong> para conformidade e resolucao de disputas.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Nota: Este e um aplicativo de demonstracao. Em producao, consulte representantes legais e sindicais
            para definir politicas adequadas de governanca de dados.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Duvidas sobre nossas praticas de monitoramento?</p>
          <p className="mt-1">
            Fale com seu gerente de frota ou com o RH para mais informacoes.
          </p>
        </div>
      </footer>
    </div>
  );
}
