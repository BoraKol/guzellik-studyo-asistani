export interface AftercareCardTemplate {
  id: string;
  title: string;
  shortTitle: string;
  nicheLabel: string;
  validWindow: string;
  summary: string;
  doItems: string[];
  dontItems: string[];
  recommendedNextVisit: string;
}

export interface ContraindicationCheckItem {
  id: string;
  label: string;
  detail: string;
  scope: 'LAZER' | 'CILT' | 'HER_IKISI';
}

/**
 * %100 deterministik, önceden onaylanmış bakım kartları.
 * Tıbbi/dermatolojik halüsinasyon riskini önlemek için AI tarafından üretilmez veya değiştirilmez.
 */
export const AFTERCARE_CARDS: readonly AftercareCardTemplate[] = [
  {
    id: 'lazer-epilasyon',
    title: 'Lazer Epilasyon Sonrası Bakım Kartı',
    shortTitle: 'Lazer Epilasyon',
    nicheLabel: 'Lazer & Cilt',
    validWindow: 'İlk 24–48 saat kritik',
    summary:
      'Uygulama bölgesindeki kıl kökleri ısıya maruz kaldığı için cildi yatıştırmak ve pigmentasyon riskini önlemek temel önceliktir.',
    doItems: [
      'İşlem sonrası 48 saat boyunca bölgeye parfümsüz yatıştırıcı krem (pantenol veya aloe vera bazlı) ince tabaka halinde sürün.',
      'Güneşe maruz kalan bölgelerde en az 2 hafta boyunca SPF 50+ geniş spektrumlu güneş koruyucu kullanın.',
      'Seans aralarında yalnızca jilet veya tüy dökücü krem tercih edin; cildi tahriş etmeyen bol pamuklu kıyafetler giyin.',
      'Hafif kızarıklık veya ısı hissi varsa temiz soğuk kompres uygulayabilirsiniz.',
    ],
    dontItems: [
      'İlk 24 saat çok sıcak duş, hamam, sauna, buhar odası, kese ve yoğun terleten ağır spor yapmayın.',
      'İlk 48 saat uygulama bölgesine parfüm, deodorant, alkollü tonik veya asitli (AHA/BHA/retinol) ürün sürmeyin.',
      'Seans sürecinde kıl kökünü alan ağda, cımbız, ip veya epilatör kesinlikle kullanmayın.',
      'En az 14 gün boyunca solaryum ve doğrudan güneşlenmeden kaçının.',
    ],
    recommendedNextVisit: 'Bir sonraki seansınız ortalama 5–6 hafta (35–42 gün) sonra planlanmalıdır.',
  },
  {
    id: 'cilt-bakimi-hydrafacial',
    title: 'Profesyonel Cilt Bakımı & Hydrafacial Sonrası',
    shortTitle: 'Cilt Bakımı / Hydrafacial',
    nicheLabel: 'Lazer & Cilt',
    validWindow: 'İlk 24–72 saat hassas dönem',
    summary:
      'Gözenekler arındırılıp cilt bariyeri yenilendiği için ilk günlerde nem desteği ve güneş koruması kalıcılığı belirler.',
    doItems: [
      'İlk akşam yüzünüzü sadece nazik bir temizleyici veya ılık su ile yıkayıp bariyer destekleyici nemlendirici uygulayın.',
      'Gündüzleri bulutlu havalarda dahi SPF 50 güneş koruyucuyu 2–3 saatte bir yenileyin.',
      'Cildin nem dengesini desteklemek için işlem günü ve ertesi gün bol su tüketin.',
      'Temiz yastık kılıfı kullanmaya özen gösterin.',
    ],
    dontItems: [
      'İlk 24 saat fondöten, kapatıcı ve ağır ten makyajı yapmayın; cildin nefes almasına izin verin.',
      'İlk 72 saat AHA, BHA, glikolik asit, retinol, C vitamini yüksek serumları ve granüllü peelingleri kullanmayın.',
      'İlk 24 saat sauna, buhar banyosu, havuz ve cilde doğrudan sıcak su temasından kaçının.',
      'Ciltte oluşabilecek ufak pütür veya kabuklanmaları kesinlikle sıkmayın.',
    ],
    recommendedNextVisit: 'Cilt yenilenme döngüsü için 28–35 gün sonra kontrol bakımınız önerilir.',
  },
  {
    id: 'protez-tirnak-kalici-oje',
    title: 'Protez Tırnak & Kalıcı Oje Bakım Kartı',
    shortTitle: 'Protez Tırnak & Oje',
    nicheLabel: 'Tırnak & Kaş/Kirpik',
    validWindow: '3 haftalık kalıcılık rehberi',
    summary:
      'Jel yapının kalkma yapmadan ve doğal tırnağa zarar vermeden uzun süre formunu koruması için günlük koruma alışkanlıkları.',
    doItems: [
      'Bulaşık, çamaşır suyu, yağ çözücü gibi kimyasal temizlik ürünleriyle temas ederken mutlaka koruyucu eldiven takın.',
      'Tırnak etlerinin esnekliğini korumak için her akşam kütikül bakım yağı ile hafif masaj yapın.',
      'Tırnak uzadıkça ağırlık merkezi değişeceği için 21 gün (3 hafta) dolmadan bakım/yenileme randevunuzu planlayın.',
      'Çıkarma işlemini doğal tırnak plağını korumak adına mutlaka stüdyoda profesyonel yöntemle yaptırın.',
    ],
    dontItems: [
      'Tırnaklarınızı konserve kapağı açmak, etiket kazımak veya sert cisimleri kaldırmak için alet gibi kullanmayın.',
      'Kenardan hafif kalkma hissederseniz kesinlikle koparmayın veya zorlayarak soymayın.',
      'İlk 24 saat uzun süreli aşırı sıcak banyo, sauna ve hamam temasını sınırlayın.',
      'Asetonlu agresif temizleyicilerle jel yüzeyi silmeye çalışmayın.',
    ],
    recommendedNextVisit: 'Sağlıklı uzama ve form koruması için 21 gün sonra yenileme önerilir.',
  },
  {
    id: 'kirpik-lifting-kas-laminasyon',
    title: 'Kirpik Lifting & Kaş Laminasyon Sonrası',
    shortTitle: 'Kirpik & Kaş',
    nicheLabel: 'Tırnak & Kaş/Kirpik',
    validWindow: 'İlk 24 saat sabitleme süreci',
    summary:
      'Keratin ve şekillendirme bağlarının tam olarak sabitlenmesi için ilk 24 saatlik koruma işlem ömrünü 6–8 haftaya çıkarır.',
    doItems: [
      'İlk 24 saatten sonra her sabah temiz fırçanızla kirpik ve kaşlarınızı yukarı doğru nazikçe tarayın.',
      '48 saat sonrasında keratin veya besleyici kaş/kirpik serumu ile nem desteği sağlayabilirsiniz.',
      'Makyaj temizliğinde su bazlı ve yağsız temizleyiciler tercih edin.',
    ],
    dontItems: [
      'İlk 24 saat yüz yıkama, duş buharı, yağmur, sauna, havuz ve terleme dahil hiçbir su/buhar teması olmamalıdır.',
      'İlk 24 saat rimel, kaş jeli, göz kremi veya makyaj temizleme yağı uygulamayın.',
      'İlk gece yüzüstü yastığa bastırarak uyumaktan ve göz/kaş bölgesini ovuşturmaktan kaçının.',
      'İşlem süresince suya dayanıklı (waterproof) rimel ve çift fazlı yağ bazlı temizleyiciler kullanmayın.',
    ],
    recommendedNextVisit: 'Doğal döngüye uygun olarak 45 gün sonra yenileme işlemi yapılabilir.',
  },
];

/**
 * %100 deterministik işlem öncesi güvenlik kontrol listesi (Lazer Epilasyon & Cilt Bakımı).
 */
export const PRE_SESSION_SAFETY_CHECKLIST: readonly ContraindicationCheckItem[] = [
  {
    id: 'isotretinoin',
    label: 'Son 6 ay içinde izotretinoin (Roaccutane / Zoretanin vb.) kullanımı',
    detail: 'Cilt bariyeri ve ışığa duyarlılık yüksek risk taşır; lazer ve yoğun peeling işlemleri ertelenmelidir.',
    scope: 'HER_IKISI',
  },
  {
    id: 'pregnancy',
    label: 'Hamilelik şüphesi, gebelik veya aktif emzirme dönemi',
    detail: 'Lazer epilasyon ve belirli aktif içerikli cilt bakımları için stüdyo güvenlik protokolü gereği ön onay gerekir.',
    scope: 'HER_IKISI',
  },
  {
    id: 'sunburn-solarium',
    label: 'Son 14 gün içinde yoğun güneşlenme, güneş yanığı veya solaryum',
    detail: 'Bronzlaşmış veya hassaslaşmış ciltte lazer uygulaması leke ve yanık riski oluşturur.',
    scope: 'LAZER',
  },
  {
    id: 'active-infection',
    label: 'Uygulama bölgesinde açık yara, uçuk (herpes), egzama alevlenmesi veya aktif enfeksiyon',
    detail: 'Enfeksiyonun yayılmaması için cilt tamamen iyileşene kadar işlem yapılmamalıdır.',
    scope: 'HER_IKISI',
  },
  {
    id: 'photosensitive-meds',
    label: 'Son 7–14 günde ışığa duyarlılık yaratan antibiyotik, kortizon veya yüksek doz retinol kullanımı',
    detail: 'Enerji parametreleri ve bakım asitleri açısından uzman değerlendirmesi gerektirir.',
    scope: 'HER_IKISI',
  },
  {
    id: 'wax-epilator',
    label: 'Lazer bölgesinde son 3 haftada ağda, cımbız veya epilatör ile kökten alım yapılması',
    detail: 'Kıl kökü olmadığı için lazer etkinliği düşer; seansın verimli olması için yeniden planlama önerilir.',
    scope: 'LAZER',
  },
];

export const CONTRAINDICATION_PROTOCOL_WARNING =
  'İşlem öncesi uzman değerlendirmesi / erteleme gerekebilir. İşaretlenen güvenlik maddesi stüdyo protokolü gereği uygulama öncesi onay veya doktor görüşü gerektirir; işlem kaydına not düşülerek randevu yeniden planlanmalıdır.';
