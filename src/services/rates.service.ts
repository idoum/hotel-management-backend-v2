/**
 * @file src/services/rates.service.ts
 * @description Service de tarification: sélection de plan et calcul nuit-à-nuit
 *              avec prix + restrictions (CTA/CTD/min/max stay/closed).
 */
import RatePlan from '@/models/RatePlan';
import RatePlanPrice from '@/models/RatePlanPrice';
import RateRestriction from '@/models/RateRestriction';

/** Helpers date (sans dépendances externes) */
function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate()+n); x.setHours(0,0,0,0); return x; }
function fmtDate(d: Date): string {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function dateListInclusive(ci: Date, co: Date): string[] {
  // [ci..co) -> liste des dates de nuitées (exclut co)
  const out: string[] = [];
  for (let d = startOfDay(ci); d.getTime() < startOfDay(co).getTime(); d = addDays(d, 1)) out.push(fmtDate(d));
  return out;
}

export type QuoteParams = {
  rate_plan?: RatePlan | null;
  rate_plan_id?: number;
  room_type_id?: number | null;
  plan_code?: string | null;       // ex 'BAR' si pas d'id
  check_in: string;                // 'YYYY-MM-DD'
  check_out: string;               // 'YYYY-MM-DD'
  adults?: number;                 // défaut 2
  children?: number;               // défaut 0
};

export type QuoteNight = {
  date: string;
  base: number;
  extra_adult: number;
  extra_child: number;
  total: number;
  closed: boolean;
  reason?: string | undefined;
};

export type QuoteResult = {
  plan: { id: number; code: string; name: string; currency: string; room_type_id: number | null; };
  params: { check_in: string; check_out: string; adults: number; children: number; nights: number; selected_by: 'rate_plan_id'|'room_type_id'|'fallback'; };
  nights: QuoteNight[];
  total: number;       // somme des totals (hors qty)
  closed: boolean;     // true si une nuit est fermée (ou sans prix)
};

/**
 * @function selectRatePlan
 * @description Trouve un RatePlan à partir d'un id OU (room_type_id, plan_code) avec fallback global.
 */
export async function selectRatePlan(opts: { rate_plan_id?: number | undefined; room_type_id?: number | null | undefined; plan_code?: string | null | undefined; }): Promise<RatePlan | null> {
  const { rate_plan_id, room_type_id, plan_code } = opts;
  if (rate_plan_id) return RatePlan.findByPk(rate_plan_id);

  // priorité : (code & room_type_id) → (code & global) → (any RT) → (any global)
  const code = plan_code ?? 'BAR';
  const wherePrefCodeRt: any = { code, room_type_id };
  const wherePrefCodeGlobal: any = { code, room_type_id: null };
  const whereAnyRt: any = { room_type_id };
  const whereAnyGlobal: any = { room_type_id: null };

  return (await RatePlan.findOne({ where: wherePrefCodeRt })) ||
         (await RatePlan.findOne({ where: wherePrefCodeGlobal })) ||
         (room_type_id != null && await RatePlan.findOne({ where: whereAnyRt, order: [['id','ASC']] })) ||
         (await RatePlan.findOne({ where: whereAnyGlobal, order: [['id','ASC']] }));
}

/**
 * @function quoteRatePlan
 * @description Calcule les prix nuit-à-nuit + total pour un RatePlan donné.
 */
export async function quoteRatePlan(params: QuoteParams): Promise<QuoteResult> {
  const adults = params.adults ?? 2;
  const children = params.children ?? 0;

  // 1) Sélection du plan si non fourni
  let rp = params.rate_plan ?? null;
  if (!rp) {
    rp = await selectRatePlan({ rate_plan_id: params.rate_plan_id, room_type_id: params.room_type_id ?? null, plan_code: params.plan_code ?? null });
  }
  if (!rp) throw new Error('Rate plan not found');

  // 2) Liste des dates (nuits)
  const ci = startOfDay(new Date(params.check_in));
  const co = startOfDay(new Date(params.check_out));
  const dates = dateListInclusive(ci, co);
  const nightsCount = dates.length;

  // 3) Charger prix & restrictions
  const [prices, restrictions] = await Promise.all([
    RatePlanPrice.findAll({ where: { rate_plan_id: rp.id, date: dates } }),
    RateRestriction.findAll({ where: { rate_plan_id: rp.id, date: dates } })
  ]);

  const priceByDate = new Map(prices.map(p => [p.date, p]));
  const restByDate  = new Map(restrictions.map(r => [r.date, r]));

  // 4) Calcul par nuit
  const nights: QuoteNight[] = [];
  let closedAny = false;
  for (let i = 0; i < dates.length; i++) {
    const d: string = dates[i]!;
    const p = priceByDate.get(d);
    if (!p) { closedAny = true; nights.push({ date: d, base: 0, extra_adult: 0, extra_child: 0, total: 0, closed: true, reason: 'no_price' }); continue; }

    const r = restByDate.get(d);
    let closed = !!p.closed;
    let reason = '';

    // CTA/CTD
    if (!closed && r?.cta && i === 0) { closed = true; reason = 'cta'; }
    if (!closed && r?.ctd && i === dates.length - 1) { closed = true; reason = 'ctd'; }

    // Min/Max stay
    if (!closed && (r?.min_stay || r?.max_stay)) {
      if (r?.min_stay && nightsCount < r.min_stay) { closed = true; reason = `min_stay:${r.min_stay}`; }
      if (r?.max_stay && nightsCount > r.max_stay) { closed = true; reason = `max_stay:${r.max_stay}`; }
    }

    const base = Number(p.price_base);
    const extraAdult = Math.max(0, adults - 2) * Number(p.price_extra_adult);
    const extraChild = Math.max(0, children) * Number(p.price_extra_child);
    const total = closed ? 0 : Math.max(base, base + extraAdult + extraChild);

    if (closed) closedAny = true;
    nights.push({ date: d, base, extra_adult: extraAdult, extra_child: extraChild, total, closed, reason: closed ? (reason || 'closed') : undefined });
  }

  const grandTotal = nights.reduce((s, n) => s + n.total, 0);

  return {
    plan: { id: rp.id, code: rp.code, name: rp.name, currency: rp.currency, room_type_id: rp.room_type_id },
    params: { check_in: fmtDate(ci), check_out: fmtDate(co), adults, children, nights: nightsCount, selected_by: params.rate_plan_id ? 'rate_plan_id' : (params.room_type_id != null ? 'room_type_id' : 'fallback') },
    nights,
    total: grandTotal,
    closed: closedAny
  };
}
