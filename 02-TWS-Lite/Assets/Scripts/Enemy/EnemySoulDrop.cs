using UnityEngine;

public class EnemySoulDrop : MonoBehaviour
{
    [Header("Drop Identity")]
    public SoulType soulType;

    [Tooltip("Boss enemy dùng drop logic riêng sau này")]
    public bool isBoss = false;

    [Header("Runtime Rank")]
    public SoulRank currentRank = SoulRank.Common;
    public bool rankInitialized = false;

    [Header("Rank Roll Weights")]
    [Range(0f, 100f)] public float eliteChance = 25f;
    [Range(0f, 100f)] public float leaderChance = 5f;
    // Boss không roll ở đây. Boss là lane riêng.

    // ================= PUBLIC API =================

    public void ActivateRankIfNeeded()
    {
        if (rankInitialized)
            return;

        if (isBoss)
        {
            currentRank = SoulRank.Boss;
            rankInitialized = true;

            Debug.Log($"[EnemySoulDrop] {gameObject.name} initialized as BOSS");
            return;
        }

        currentRank = RollRank();
        rankInitialized = true;

        Debug.Log($"[EnemySoulDrop] {gameObject.name} rolled rank = {currentRank}");
    }

    public void SetupDroppedSoul(GameObject droppedSoul)
    {
        if (droppedSoul == null)
            return;

        // Nếu enemy chết mà chưa từng bị đánh, vẫn đảm bảo có rank
        ActivateRankIfNeeded();

        SoulObject soulObject = droppedSoul.GetComponent<SoulObject>();
        if (soulObject != null)
        {
            soulObject.soulType = soulType;
            soulObject.soulRank = currentRank;

            Debug.Log(
                $"[EnemySoulDrop] SetupDroppedSoul -> {soulType} | {currentRank}"
            );
        }
        else
        {
            Debug.LogWarning(
                $"[EnemySoulDrop] SoulObject missing on dropped soul prefab: {droppedSoul.name}"
            );
        }

        SoulPickup soulPickup = droppedSoul.GetComponent<SoulPickup>();
        if (soulPickup != null)
        {
            soulPickup.SoulType = soulType;
            soulPickup.soulRank = currentRank;
        }
    }

    // ================= INTERNAL =================

    private SoulRank RollRank()
    {
        float roll = Random.Range(0f, 100f);

        if (roll < leaderChance)
            return SoulRank.Leader;

        if (roll < leaderChance + eliteChance)
            return SoulRank.Elite;

        return SoulRank.Common;
    }
}