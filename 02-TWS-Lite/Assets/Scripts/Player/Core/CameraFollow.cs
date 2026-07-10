using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [SerializeField] private Transform target;

    [SerializeField] private Vector3 offset =
        new Vector3(0f, 8f, -8f);

    private void LateUpdate()
    {
        transform.position =
            target.position + offset;
    }
}