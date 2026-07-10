using UnityEngine;

[System.Serializable]
public class SoulCollectionEntry
{
    // ================= CORE DATA =================
    public SoulType soulType;

    public int eliteCount;
    public bool hasLeader;
    public bool hasBoss;

    // ================= FUTURE COMBAT HOOK =================
    
    // số elite đang active trên map (runtime)
    public int activeEliteCount;

    // reserve system (chuẩn bị cho elite queue logic)
    public int reserveEliteCount;

    // leader active state (future safe)
    public bool leaderIsActive;

    // boss active state (future safe)
    public bool bossIsActive;

    // ================= HELPERS =================

    public int GetTotalElite()
    {
        return eliteCount;
    }

    public int GetAvailableEliteForCombat()
    {
        return Mathf.Max(0, eliteCount - activeEliteCount);
    }
}