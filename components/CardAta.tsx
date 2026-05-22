import { BookOpen, Building2, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';

interface CardProps {
  data: PNCPResult;
  index: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export default function CardAta({ data, index, onSelect, isSelected }: CardProps) {
  const id = gerarId(data, index);

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-300 cursor-pointer
        ${isSelected
          ? 'border-brand-forest/50 bg-brand-forest/[0.03] shadow-md shadow-brand-forest/5'
          : 'border-brand-sand/30 bg-white hover:border-brand-sand/60 hover:shadow-lg hover:shadow-brand-navy/5'
        }`}
      onClick={() => onSelect(id)}
    >
      {/* Top accent bar */}
      <div className={`h-1 rounded-t-xl transition-colors duration-300 ${isSelected ? 'bg-brand-forest' : 'bg-brand-forest/10 group-hover:bg-brand-forest/20'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-forest/5 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-forest" />
            </div>
            <div>
              <span className="font-body text-xs font-semibold text-brand-forest uppercase tracking-wide">
                Ata de RP
              </span>
              <span className="font-body text-xs text-brand-navy/40 block">
                {data.numeroAtaRegistroPreco}/{data.anoAta}
              </span>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0
              ${isSelected
                ? 'border-brand-forest bg-brand-forest'
                : 'border-brand-sand/50 group-hover:border-brand-navy/30'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Object */}
        <p className="font-body text-sm text-brand-ink/80 mb-4 line-clamp-3 leading-relaxed" title={data.objetoAta}>
          {data.objetoAta}
        </p>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-brand-navy/60">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-brand-navy/30" />
            <span className="truncate">{data.orgaoEntidade?.razaoSocial || data.unidadeOrgao?.nomeUnidade || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-navy/60">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-navy/30" />
            <span>{data.unidadeOrgao?.ufSigla || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-navy/60">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-brand-navy/30" />
            <span>Início: {new Date(data.dataVigenciaInicio).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-brand-sand/20 flex justify-between items-center">
          <span className="font-heading text-base text-brand-navy">
            {data.valorInicial
              ? data.valorInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : 'Valor não informado'}
          </span>
          <a
            href={data.linkArquivo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy/50 hover:text-brand-navy transition-colors"
          >
            PDF <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
