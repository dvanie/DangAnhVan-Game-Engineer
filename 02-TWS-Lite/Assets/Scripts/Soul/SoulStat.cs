using UnityEngine;

public class SoulStats : MonoBehaviour
{
    [Header("Identity")]
    public SoulType SoulType;
    public SoulRank rank;
    public ShadowClass shadowClass;

    private GameManager gameManager;
    private SummonCombat summonCombat;

    private void Awake()
    {
        gameManager = FindAnyObjectByType<GameManager>();
        summonCombat = GetComponent<SummonCombat>();
    }

    private void Start()
    {
        ApplyStats();
    }

    // ================= EXTERNAL INIT =================
    public void Initialize(SoulType type, SoulRank summonRank)
    {
        SoulType = type;
        rank = summonRank;
        ApplyStats();
    }

    // ================= CORE APPLY =================
    private void ApplyStats()
    {
        if (gameManager == null || summonCombat == null)
        {
            Debug.LogWarning("[SoulStats] Missing references!");
            return;
        }

        SoulData data = gameManager.GetSoulData(SoulType, rank);

        if (data == null)
        {
            Debug.LogWarning(
                $"[SoulStats] Missing SoulData for {SoulType} - {rank}"
            );
            return;
        }

        Debug.Log(
            $"[SoulStats] Applying {SoulType} - {rank} | " +
            $"dmg={data.attackDamage}, cd={data.attackCooldown}, " +
            $"move={data.moveSpeed}, range={data.attackRange}"
        );

        ApplyCombatStats(data);
        ApplyIdentity(data);
    }

    // ================= COMBAT STATS =================
    private void ApplyCombatStats(SoulData data)
    {
        summonCombat.attackDamage = data.attackDamage;
        summonCombat.attackCooldown = data.attackCooldown;
        summonCombat.moveSpeed = data.moveSpeed;
        summonCombat.attackRange = data.attackRange;
    }

    // ================= IDENTITY =================
    private void ApplyIdentity(SoulData data)
    {
        rank = data.rank;
        shadowClass = data.ShadowClass;
    }
}